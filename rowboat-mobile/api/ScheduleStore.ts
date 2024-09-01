import { atom } from "jotai";
import { Day, DayPatch, Schedule, Week } from "./Models";

export const weeksAtom = atom<Week[]>();
export const daysAtom = atom<Day[]>();
export const offDaySymbolAtom = atom<string>("🤍");

export const schedulesAtom = atom(async (get) => {
    const weeks = get(weeksAtom);
    const days = get(daysAtom);
    let schedules: Schedule[] = []
    weeks !== undefined && weeks.map((week: Week) => {
        schedules.push({week: week, days: days ? days.filter((day) => day.week_id == week.week_id) : null});
    });
    return schedules
});

export const lastUpdatedAtom = atom<string>("");

export const patchDaysAtom = atom<Map<number, DayPatch>>(new Map<number, DayPatch>());