export interface Week {
    week_id: number,
    week_of: string,
    has_passed: boolean,
    total_hours: number
}

export interface Day {
    day_id: number,
    week_id: number,
    date: string,
    start_time: string,
    end_time: string,
    shift_hours: number,
    alt_dept: string
    manually_changed: boolean,
}

export interface DayPatch {
    day_id: number,
    start_time: string,
    end_time: string,
    alt_dept: string,
}

export interface Schedule {
    week: Week,
    days: Day[] | null
}

export const deptAbbreviations = new Map<string, string>([[
    "086/Member Service", "MS"
], [
    "050/Inventory Asst", "Inv Ast"
]]);

export const offDaySymbols = ["🤍", "⚪️", "⭐️", "❌", "OFF", ":3"]