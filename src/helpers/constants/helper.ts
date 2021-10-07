import moment from "moment";
import { BookedTimeDto } from "../../modules/booked-time/dto/booked-time.dto";
import { ProxyDto } from "../../modules/proxy/dto/proxy.dto";

export function createProxyString(proxy: ProxyDto): String {
        return `${proxy.ipAddress}:${proxy.port}`;
}

export function pickTheBestDate(bookedTimeDto: BookedTimeDto, newDate: Date): Date {
    const prevTime: Date = bookedTimeDto.bookedDate;
    const earliestDate: Date = bookedTimeDto.earliestDate;

    const timeDiffFromEarliestTime = (moment(new Date(newDate)).valueOf() - moment(new Date(earliestDate)).valueOf()) / 60000;
    const timeDiff = (moment(new Date(prevTime)).valueOf() - moment(new Date(newDate)).valueOf()) / 60000;

    //start with booking time thats above the earliest time
    if(timeDiffFromEarliestTime > 0 ) {
        //timeDiff > 0 - means new time is behind of the prev time
        //timeDiff < 0 - means new time is ahead the prev time

        if(timeDiff > -21000 && prevTime.getHours() < 11 && newDate.getHours() >= 11) {
            //If new time is ahead by a maximum of 2 weeks and the time is after 11am or after than pick this time
            return newDate;
        } else if (timeDiff > 21000) {
            //If new time is behind by 2 weeks or more than pick this time
            return newDate;
        } else {
            //The times are within 2 weeks of each other
            if(timeDiff > 0 && newDate.getHours() > 11) {
                //Pick new time 
                return newDate
            } else {
                return prevTime;
            }
        }

    } else {
        return newDate;
    }
}