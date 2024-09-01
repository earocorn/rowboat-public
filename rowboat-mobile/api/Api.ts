import { Day, DayPatch, Week } from "./Models";

const serverURL = "http://10.146.49.253:8080";

export async function fetchDays(week_id: number): Promise<Day[]> {
    let data = []
    try{
        const response = await fetch(`${serverURL}/weeks/${week_id}`);
        const jsonResponse = await response.json();
        data = jsonResponse.sort((a: Week, b: Week) => {
        const dateA = new Date(a.week_of).getTime()
        const dateB = new Date(b.week_of).getTime()
        if(dateA > dateB) {
            return 1
        } else if(dateA < dateB) {
            return -1
        }
        return 0
    });
    } catch(error) {
        console.log(error);
    }
    return data;
}

export async function fetchWeeks(): Promise<Week[]> {
    try{
        const response = await fetch(`${serverURL}/weeks`);
        const jsonResponse = await response.json();
        return jsonResponse.sort((a: Week, b: Week) => {
                const dateA = new Date(a.week_of).getTime()
                const dateB = new Date(b.week_of).getTime()
                if(dateA > dateB) {
                    return 1
                } else if(dateA < dateB) {
                    return -1
                }
                return 0
            });
    } catch(error) {
        console.log(error);
    }
    const items: Week[] = []
    return items
}

export const requestUpdateSchedules = async () => {
    return fetch(`${serverURL}/scrape`, { method: "POST" });
}

export async function registerToken(userToken: string) {
    return fetch(`${serverURL}/device`, { 
        method: "POST", 
        body: JSON.stringify({
            token: userToken
        }) });
}

export async function fetchLastUpdated(): Promise<string> {
    try{
        const response = await fetch(`${serverURL}/scrape/status`)
        if(response.status != 200) {
            return '';
        }
        const responseJson = await response.json();
        return responseJson.last_updated;
    } catch(error) {
        console.error(error)
        return ''
    }
}

async function patchDay(day: DayPatch): Promise<boolean> {
    let isSuccessful = false;

    try {
        const response = await fetch(`${serverURL}/days/${day.day_id}`, { 
            method: "PATCH", 
            body: JSON.stringify({
                start_time: day.start_time,
                end_time: day.end_time,
                alt_dept: day.alt_dept,
            }) });
        isSuccessful = response.ok;
    } catch(error) {
        console.error(error);
        isSuccessful = false;
    }

    return isSuccessful;
}

// Return num successful
export async function patchDays(days: DayPatch[]): Promise<number> {
    let numSuccessful = 0;

    await Promise.all(days.map(async (day) => {
        const patchSuccessful = await patchDay(day);
        if(patchSuccessful) {
            numSuccessful++;
        }
    }));

    return numSuccessful;
}