import { Captcha } from '../../helpers/captcha';
import { ElementHandle, Page } from 'puppeteer';
import { Log } from '../../providers/utils/Log';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { BookedTimeService } from '../../modules/booked-time/booked-time.service';
import { BOOKING_STATUS } from './DSA-status';

interface ChosenTestCentre {
  location: string;
  availableTimeSlot: {
    date: ElementHandle<Element>;
    time: number;
    id: string;
  };
}

export class DSA {
  private log = new Log('DSA', Math.floor(Math.random() * 10)).api();
  private defaultTimeOut: number = 5 * 1000;
  private defaultWaitForTimeout = 1 * 1000;
  private myChosenMonths: string[] = [
    'October',
    'November',
    'December',
    'January',
  ];
  private preferredLocation: string[] = [
    'Tottenham',
    'Enfield (Brancroft Way)',
    'Wood Green (London)',
    'Enfield (Innova Business Park)',
    'Barnet (London)',
    'St Albans',
  ];
  private testCentreSelected: ChosenTestCentre;
  private submittingTimeProcess: string;
  private dbTime: { time: Date; updated: boolean };
  private listOfTriedTimes: string[];
  //When the
  private listOfClickedCentres: {
    timeWhenInitiated: Date;
    centres: string[];
  } = { timeWhenInitiated: null, centres: [] };

  constructor(
    private page: Page,
    private url: string,
    private apiConfigService: ApiConfigService,
    private bookedTimeService: BookedTimeService,
    private captcha: Captcha,
  ) {}

  private async resetSelectedLocation() {
    this.testCentreSelected = {
      location: null,
      availableTimeSlot: null,
    };
    this.listOfTriedTimes = [];
  }

  public async test() {
    this.log.info('-------------------- Started --------------------');
    //Wraps the whole application in a try and catch
    await this.page.goto('http://localhost:3000/', {
      waitUntil: ['domcontentloaded'],
    }),
      this.log.info('-- Entering -> loginToSite() --');
    await this.page.waitForTimeout(5 * 1000);
    throw new Error('hello');
  }

  /**
   * The main start process
   */
  public async start(): Promise<boolean> {
    this.log.info('-------------------- Started --------------------');
    //Wraps the whole application in a try and catch

    try {
      await this.page.goto(this.url, { waitUntil: ['domcontentloaded'] }),
        this.log.info('-- Entering -> loginToSite() --');

      await this.page.waitForTimeout(5 * 1000);
      await this.loginToSite();

      while (true) {
        this.submittingTimeProcess = BOOKING_STATUS.FIRST_TIME;

        await this.resetSelectedLocation();
        await this.resetClickedLocations();
        //Step 1 search for test centre
        this.log.info('-- Entering -> searchForTestCentre() --');
        await this.searchForTestCentre();
        this.log.info('-- Exiting <- searchForTestCentre() --');

        //Step 2 go through the test centres
        this.log.info('-- Entering -> loopThroughEachTestCentre() --');
        await this.loopThroughEachTestCentre();

        //Step 3 pick a time
        if (
          this.testCentreSelected.location != null ||
          this.testCentreSelected.location != undefined
        ) {
          //We have found a location
          //Now we need to pick a time slot
          this.log.info('-- Entering -> selectAnAvailableDate() --');
          await this.selectAnAvailableDate();
        }

        //Step 4 we should now have the time slot
        //We are going to book
        if (this.testCentreSelected.availableTimeSlot != null) {
          this.log.info('Step 4 we should now have the time slot');
          const currentUrl: string = this.page.url();
          await this.handleConfirmingATime(currentUrl, 0);
        }

        if (this.submittingTimeProcess == BOOKING_STATUS.TIME_BOOKED) {
          return;
        }

        await Promise.all([
          this.page.waitForNavigation(),
          this.page.goto(
            'https://driverpracticaltest.dvsa.gov.uk/manage?execution=e2s1',
          ),
        ]);
        // await this.page.goto(
        //   'https://driverpracticaltest.dvsa.gov.uk/manage?execution=e2s1',
        // );
        // await this.page.waitForTimeout(2 * 1000);
        await this.verifyIfWeNeedToDoACaptcha();
      }
    } catch (err) {
      throw err;
    }
  }

  /**
   * Three things can happen when trying to book a time
   * 1. The time we chose to book is no longer available - In this case we have to try
   * and find another available time on the same centre we clicked
   * 2. When we about to confirm a booking another thread/cluster has booked
   * a different time and this time now becomes invalid - Do nothing and restart the whole process
   * 3. Successfully booked a time - Do nothing
   */
  private async handleConfirmingATime(
    url: string,
    count: number,
  ): Promise<void> {
    if (count < 5) {
      try {
        if (this.submittingTimeProcess == BOOKING_STATUS.FIRST_TIME) {
          await this.confirmAndBookTime();
        } else if (
          this.submittingTimeProcess == BOOKING_STATUS.TIME_NO_LONGER_AVAILABLE
        ) {
          this.testCentreSelected.availableTimeSlot = null;
          await this.selectAnAvailableDate();
          await this.confirmAndBookTime();
        } else if (
          this.submittingTimeProcess == BOOKING_STATUS.DB_NOT_UPDATED
        ) {
          this.testCentreSelected.availableTimeSlot = null;
          await this.selectAnAvailableDate();
          await this.confirmAndBookTime();
        } else {
          return;
        }

        await Promise.all([this.page.waitForNavigation(), this.page.goto(url)]);

        await this.page.waitForTimeout(2 * 1000);
        count++;
        await this.handleConfirmingATime(url, count);
      } catch (err) {
        //Just catch the error and do nothing;
        this.log.warn(
          `Chance of timeout error - Possibility of there no longer being times available - Error ${err}`,
        );
        this.submittingTimeProcess = 'Failed';
      }
    } else {
      //tried to find new times 5 times
      return;
    }
  }

  private async loginToSite() {
    //Selectors for Login
    const userNameSelector = 'input[name="username"]';
    const passwordSelector = 'input[name="password"]';
    const pressButton = 'input[name="booking-login"]';

    //Check if theres a queue to get onto the site
    await this.checkIfWeInQueue(userNameSelector);

    await this.verifyIfWeNeedToDoACaptcha();

    await this.page.type(
      userNameSelector,
      this.apiConfigService.getLicense.licenseNumber,
    );
    await this.page.type(
      passwordSelector,
      this.apiConfigService.getLicense.referenceNumber,
    );

    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click(pressButton),
    ]);
    // await this.page.click(pressButton);

    this.log.info('Successfully logged in');
  }

  /**
   * Firsts searches for a centre
   */
  private async searchForTestCentre(): Promise<void> {
    await this.page.waitForTimeout(this.defaultWaitForTimeout);

    const testCentreName = 'input[name="testCentreName"]';
    const testCentreSubmit = 'input[name="testCentreSubmit"]';

    const changeCentre = await this.page.waitForSelector(
      '#test-centre-change',
      {
        timeout: this.defaultTimeOut,
      },
    );

    await Promise.all([this.page.waitForNavigation(), changeCentre.click()]);
    // await changeCentre.click();

    await this.verifyIfWeNeedToDoACaptcha();

    await this.page.waitForSelector(testCentreName, {
      timeout: this.defaultTimeOut,
    });

    await this.page.type(testCentreName, 'N9 9PL');

    await Promise.all([
      this.page.click(testCentreSubmit),
      this.page.waitForNavigation(),
    ]);
    // await this.page.click(testCentreSubmit);

    await this.verifyIfWeNeedToDoACaptcha();
  }

  private async loopThroughEachTestCentre() {
    let clickCount = 0;

    while (clickCount < 5) {
      await this.verifyIfWeNeedToDoACaptcha();
      if (await this.scrollThroughListOfCentres()) {
        break;
      }
      clickCount++;
    }
  }

  private async scrollThroughListOfCentres(): Promise<boolean> {
    //TODO do not re click
    await this.page.waitForSelector('.test-centre-details-link', {
      timeout: this.defaultTimeOut,
    });

    const listOfCentres = await this.page.evaluate(() =>
      Array.from(
        document.querySelectorAll('.test-centre-details-link'),
        (element) => element.id,
      ),
    );

    //Step 2 - A - Loop through the centres that are on screen
    for (let centreId = 0; centreId < listOfCentres.length; centreId++) {
      let elementId = listOfCentres[centreId];

      await this.page.waitForSelector(`#${elementId}`, {
        timeout: this.defaultTimeOut,
      });

      let centreDatesFound = await this.page.$(
        `#${elementId} > .test-centre-details > .underline > h5`,
      );
      let centreLocation = await this.page.$(
        `#${elementId} > .test-centre-details > .underline > h4`,
      );
      centreLocation = await (
        await centreLocation.getProperty('textContent')
      ).jsonValue();

      centreDatesFound = await (
        await centreDatesFound.getProperty('textContent')
      ).jsonValue();

      let hasLocationAlreadyBeenClicked: boolean = false;
      
      if(this.listOfClickedCentres) {
        for (let index = 0; this.listOfClickedCentres.centres.length; index) {
          hasLocationAlreadyBeenClicked = this.listOfClickedCentres.centres[index] == elementId ? true : false;
        }
      }

      //Step 2 - B - Check if the centre meets our requirements
      if (await this.verifyLocation(centreDatesFound, centreLocation) && !hasLocationAlreadyBeenClicked) {
        this.log.info(
          `centre meets requirements and has available times. Location : ${centreLocation} - DateFound : ${centreDatesFound}`,
        );

        const selectedCentre = await this.page.$(`#${elementId}`);

        await Promise.all([
          this.page.waitForNavigation(),
          selectedCentre.click(),
        ]);
        // selectedCentre.click();

        await this.verifyIfWeNeedToDoACaptcha();

        //Sometimes it may say a place is available even if its not
        //Need to check.
        const isPlaceNotAvailable = await this.page.evaluate(() => {
          return document.querySelector('.warning-summary');
        });
        if (isPlaceNotAvailable) {
          this.log.info(
            'Centre was shown as available but no longer available',
          );
          const changeLocation = await this.page.$('#change-test-centre');
          await Promise.all([
            this.page.waitForNavigation(),
            changeLocation.click(),
          ]);
          // await changeLocation.click();
          await this.page.waitForTimeout(2 * 1000);
          const testCentreSubmit = 'input[name="testCentreSubmit"]';
          await Promise.all([
            this.page.waitForNavigation(),
            this.page.click(testCentreSubmit),
          ]);
          return false;
          // await this.page.click(testCentreSubmit);
        } else {
          if (this.listOfClickedCentres) {
            this.listOfClickedCentres.centres.push(elementId);
          } else {
            this.listOfClickedCentres = {
              timeWhenInitiated: new Date(),
              centres: [elementId],
            };
          }
          this.log.info(`Location has times available`);

          this.testCentreSelected.location = JSON.stringify(
            centreLocation,
          ).replace(/['"]+/g, '');
          return true;
        }
      }
    }

    const clickMoreCentres = await this.page.waitForSelector(
      '#fetch-more-centres',
      {
        timeout: this.defaultTimeOut,
      },
    );

    await Promise.all([
      this.page.waitForNavigation(),
      clickMoreCentres.click(),
    ]);

    return false;
  }

  private async selectAnAvailableDate(): Promise<void> {
    this.log.info('- Inside selectAnAvailableDate() -');

    await this.page.waitForTimeout(this.defaultWaitForTimeout);

    let currentMonth = await this.page.$('.BookingCalendar-currentMonth');
    currentMonth = await (
      await currentMonth.getProperty('textContent')
    ).jsonValue();

    this.log.info(`Current month ${currentMonth}`);

    //Step 3 - A - Double check the month is correct
    if (await this.isDateAvailableDuringTheMonthIWant(currentMonth)) {
      //Step 4 - Book from available dates
      await this.pickAnAvailableTimeSlot();
    }

    this.log.info('- Exiting selectAnAvailableDate() -');
  }

  private async isDateAvailableDuringTheMonthIWant(month: any) {
    let isInRange = false;

    for (let i = 0; i < this.myChosenMonths.length; i++) {
      if (month.includes(this.myChosenMonths[i])) {
        isInRange = true;
      }
    }

    return isInRange;
  }

  /**
   * Look for available time slot
   */
  private async pickAnAvailableTimeSlot() {
    this.log.info('- Inside pickAnAvailableTimeSlot -');
    this.log.info('Need to pick an available time slot');

    const availableDates = await this.page.$$(
      '.BookingCalendar-date--bookable > div.BookingCalendar-content > a.BookingCalendar-dateLink',
    );

    this.log.info(
      `There are ${availableDates.length} day/s availabe to pick from`,
    );

    if (availableDates.length > 1) {
      for (let index = 0; index < availableDates.length; index++) {
        let dateElement = availableDates[index];
        //May need to do extra processing
        await this.processTimeSlotsForDates(dateElement);
      }
    } else {
      let dateElement = availableDates[0];
      await this.processTimeSlotsForDates(dateElement);
    }

    this.log.info('- Exiting pickAnAvailableTimeSlot -');
  }

  /**
   * Processed timeslots for each date
   *
   * @param dateElement
   */
  private async processTimeSlotsForDates(dateElement: ElementHandle<Element>) {
    const slotPickerSelector = 'input[name="slotTime"]';
    await dateElement.click();
    await this.page.waitForSelector(`.SlotPicker-day\.is-active`, {
      timeout: this.defaultTimeOut,
    });

    let timeSlots = await this.page.$$(
      `.SlotPicker-day\.is-active > .SlotPicker-slot-label > ${slotPickerSelector}`,
    );

    this.log.info(`There are ${timeSlots.length} slots for the date chosen`);

    for (let index = 0; index < timeSlots.length; index++) {
      const time = timeSlots[index];
      const id = await (await time.getProperty('id')).jsonValue();
      let timeWasAlreadyTriedToBook: boolean = false;

      //The id for the timeslots are basically times in milliseconds e.g slot-1646727000000
      const dateInMs = parseInt(JSON.stringify(id).split('-')[1]);

      //Do not try the prev time we tried
      if (this.listOfTriedTimes.length > 0) {
        for (let index = 0; index < this.listOfTriedTimes.length; index++) {
          if (
            this.listOfTriedTimes[index] ==
            JSON.stringify(id).replace(/['"]+/g, '')
          ) {
            timeWasAlreadyTriedToBook = true;
          }
        }
      }

      if (
        (this.testCentreSelected.availableTimeSlot != null ||
          this.testCentreSelected.availableTimeSlot != undefined) &&
        timeWasAlreadyTriedToBook == false
      ) {
        this.log.info(
          `Checking timeWasAlreadyTriedToBook ${timeWasAlreadyTriedToBook}`,
        );
        const prevDateTime = new Date(
          this.testCentreSelected.availableTimeSlot.time,
        );
        const newDateTime = new Date(dateInMs);

        //if the prev time is early in the morining and new time in the afternoon pick the new time
        if (prevDateTime.getHours() < 11 && newDateTime.getHours() >= 11) {
          this.log.info(`Chosen this time ${newDateTime}`);
          this.testCentreSelected.availableTimeSlot = {
            date: dateElement,
            time: dateInMs,
            id: JSON.stringify(id).replace(/['"]+/g, ''),
          };
        }
      } else {
        if (!timeWasAlreadyTriedToBook) {
          this.log.info(
            `As this is the first slot the time chosen in ${new Date(
              dateInMs,
            )}`,
          );
          this.testCentreSelected.availableTimeSlot = {
            date: dateElement,
            time: dateInMs,
            id: JSON.stringify(id).replace(/['"]+/g, ''),
          };
        } else {
          this.testCentreSelected.availableTimeSlot = null;
        }
      }
    }
  }

  /**
   * The bot willl start the process of booking the chosen time slot
   */
  private async confirmAndBookTime() {
    const slotContinue = 'button[id="slot-warning-continue"]';
    const slotChosenSubmit = 'input[name="chooseSlotSubmit"]';
    const candidateSelector = '#i-am-candidate';
    const confirmMySlotSelector = 'input[id="confirm-changes"]';

    this.log.info(
      `The chosen Id ${this.testCentreSelected.availableTimeSlot.id}`,
    );

    this.log.info('Clicked on the chosen date');
    await this.testCentreSelected.availableTimeSlot.date.click();

    await this.page.waitForSelector(
      `#${this.testCentreSelected.availableTimeSlot.id}`,
      { timeout: this.defaultTimeOut },
    );

    const clickOnTimeSlot = await this.page.$(
      `#${this.testCentreSelected.availableTimeSlot.id}`,
    );

    this.log.info('Clicked on the chosen timeslot');
    await clickOnTimeSlot.click();

    await this.page.waitForTimeout(this.defaultWaitForTimeout);

    //Click the continue button
    this.log.info('Clicked on the continue button');
    await this.page.click(slotChosenSubmit);

    //Warning should pop up
    await this.page.waitForSelector(`${slotContinue}`, {
      timeout: this.defaultTimeOut,
    });

    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click(slotContinue),
    ]);
    // await this.page.click(slotContinue);
    await this.verifyIfWeNeedToDoACaptcha();

    //If we are too late to pick a date and its not longer available
    const timeNotAvailable = await this.page.evaluate(() => {
      return document.querySelector('.error-summary');
    });

    if (timeNotAvailable) {
      this.log.info('Time was not available');
      //The time was not available will need to check for the other times again
      this.submittingTimeProcess = BOOKING_STATUS.TIME_NO_LONGER_AVAILABLE;
      this.listOfTriedTimes.push(this.testCentreSelected.availableTimeSlot.id);
    } else {
      //if time is available then we have 15minutes to book
      let retryCount = 0;
      let updated = false;

      while (retryCount < 3) {
        try {
          updated = await this.bookedTimeService.getBookedDateByUser(
            'dilan',
            new Date(this.testCentreSelected.availableTimeSlot.time),
            this.testCentreSelected.location,
          );
          break;
        } catch (err) {
          this.log.error(`Trying to update the DB threw an error ${err}`);
          this.log.error('Issue can be due to locking. Going to retry');
          this.sleep(100);
          retryCount++;
        }
      }

      await this.verifyIfWeNeedToDoACaptcha();

      if (updated) {
        this.log.info('DB updated');
        //Sometimes the candidate selector does not appear
        await this.page.waitForTimeout(2 * 1000);
        const doesCandidatePageAppear = await this.page.evaluate(() => {
          return document.querySelector('#i-am-candidate');
        });

        if (doesCandidatePageAppear) {
          this.log.info('It appeared');
          await this.page.waitForTimeout(500);

          const yesIamTheCandidate = await this.page.$('#i-am-candidate');
          await Promise.all([
            this.page.waitForNavigation(),
            yesIamTheCandidate.click(),
          ]);
          // yesIamTheCandidate.click();
        }

        //Before confirming
        await this.page.waitForSelector(confirmMySlotSelector, {
          timeout: this.defaultTimeOut,
        });
        await this.page.waitForTimeout(this.defaultWaitForTimeout);

        this.log.info('Confirmed Booked');
        await this.page.click(confirmMySlotSelector);
        // this.submittingTimeProcess = BOOKING_STATUS.TIME_BOOKED;
      } else {
        await this.verifyIfWeNeedToDoACaptcha();
        this.listOfTriedTimes.push(
          this.testCentreSelected.availableTimeSlot.id,
        );
        this.log.info('DB did not update');
        this.submittingTimeProcess = BOOKING_STATUS.DB_NOT_UPDATED;
      }
    }
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async verifyLocation(
    centreDatesFound,
    centreLocation,
  ): Promise<boolean> {
    const datesFoundSplitText = centreDatesFound.split('/');

    let isLocationValid = false;
    let isPreferredLocation = false;

    this.preferredLocation.forEach((location) => {
      if (location == centreLocation) {
        isPreferredLocation = true;
      }
    });

    if (datesFoundSplitText.length > 1 && isPreferredLocation) {
      const avaliableDateMonth = datesFoundSplitText[1];
      this.log.info(`Month ${avaliableDateMonth}`);
      switch (avaliableDateMonth) {
        case '10':
          isLocationValid = true;
          break;
        case '11':
          isLocationValid = true;
        case '12':
          isLocationValid = true;
        case '01':
          isLocationValid = true;
      }
    }

    return isLocationValid;
  }

  private async checkIfWeInQueue(userNameSelector) {
    this.log.info('We are in Queue');
    const inQueue = await this.page.evaluate(() => {
      return document.querySelector('.warning-box');
    });

    if (inQueue) {
      await this.page.waitForSelector(userNameSelector, {
        timeout: 35 * 1000,
      });
    }
  }

  private async verifyIfWeNeedToDoACaptcha() {
    await this.page.waitForTimeout(1.3 * 1000);
    const reCaptcha = await this.page.evaluate(() => {
      return document.querySelector('#main-iframe');
    });

    if (reCaptcha) {
      this.log.info('Need to do a recaptcha');
      await this.solveCaptcha();
      this.log.info('Captcha is solved');
      await this.page.waitForTimeout(this.defaultWaitForTimeout);
    }
  }

  private async solveCaptcha() {
    const captchaIframeSelector = 'iframe[id="main-iframe"]';
    const captchaSelector = 'g-recaptcha-response';

    await this.page.waitForSelector('iframe', { timeout: this.defaultTimeOut });

    this.captcha.page = this.page;
    const isCaptchaSuccessful = await this.captcha.solveCaptcha({
      captchaSelector,
      captchaIframeSelector,
    });

    this.log.info('Captcha', isCaptchaSuccessful);
  }

  /**
   * When we are going though the centres, and there's a centre with our requirements but the
   * time is doesn't meet our other requirements. We do not want the cluster to keep trying the same centre
   * This is a way of saying, we have tried this location already so move on to the others
   *
   * We do not want to be blocking other centres
   */
  private async resetClickedLocations() {
    if (this.listOfClickedCentres) {
      const timeDiff = (new Date().getTime() - this.listOfClickedCentres.timeWhenInitiated.getTime()) / 60000

      if(timeDiff > 1.5) {
        this.listOfClickedCentres = undefined;
      }
    }
  }
}
