import { Day, DayPatch, deptAbbreviations } from "@/api/Models";
import { StyleSheet, TextInput } from "react-native";
import { ThemedView } from "../ThemedView";
import { ThemedText } from "../ThemedText";
import { useAtomValue, useSetAtom } from "jotai";
import { offDaySymbolAtom, patchDaysAtom } from "@/api/ScheduleStore";
import { useState } from "react";

interface TableProps {
    days: Day[],
    canEdit: boolean
}

interface RowProps {
    day: Day,
    text: string,
    isHighlighted: boolean,
    canEdit?: boolean,
    editType?: EditType
}

enum EditType {
    START_TIME,
    END_TIME,
    ALT_DEPT
}

export default function ScheduleTable(props: TableProps) {
    const offDaySymbolValue = useAtomValue(offDaySymbolAtom);
    const [patchDays, ] = useState<Map<number, DayPatch>>(new Map<number, DayPatch>());
    const setPatchDays = useSetAtom(patchDaysAtom);
    
    function parseAltDept(dept: string) {
        const parsedDept = deptAbbreviations.get(dept);
        return parsedDept !== undefined ? parsedDept : dept;
    }

    function updatePatchDay(originalDay: Day, text: string, editType: EditType) {
        const id = originalDay.day_id;

        const existingPatchDay = patchDays.get(id);

        if(existingPatchDay != undefined) {
            const patchDay: DayPatch = {
                day_id: id,
                start_time: editType != EditType.START_TIME ? existingPatchDay.start_time : text,
                end_time: editType != EditType.END_TIME ? existingPatchDay.end_time : text,
                alt_dept: editType != EditType.ALT_DEPT ? existingPatchDay.alt_dept : text
            };
            patchDays.set(id, patchDay);
            setPatchDays((prevDays) => prevDays.set(id, patchDay));
        } else {
            if(originalDay !== undefined) {
                const patchDay: DayPatch = {
                    day_id: id,
                    start_time: editType != EditType.START_TIME ? originalDay.start_time : text,
                    end_time: editType != EditType.END_TIME ? originalDay.end_time : text,
                    alt_dept: editType != EditType.ALT_DEPT ? originalDay.alt_dept : text
                };
                patchDays.set(id, patchDay);
                setPatchDays((prevDays) => prevDays.set(id, patchDay));
            }
        }
    }


    function RowText(props: RowProps) {
        // TODO: Get type and add to PATCH list 

        return (<>
            {props.canEdit ? (
            <TextInput onChangeText={(e) => {props.editType !== undefined && updatePatchDay(props.day, e, props.editType)}} style={!props.isHighlighted ? styles.editRowText : styles.editHighlightedRowText}>
                {props.text}
            </TextInput>) : (
            <ThemedText style={!props.isHighlighted ? styles.rowText : styles.highlightedRowText}>
                {props.text}
            </ThemedText>
            )}
        </>)
    }

    return(
    <ThemedView>
        <ThemedView style={styles.row}>
                <ThemedText style={styles.rowHeader}>
                    Day
                </ThemedText>
                <ThemedText style={styles.rowHeader}>
                    Date
                </ThemedText>
                <ThemedText style={styles.rowHeader}>
                    Start
                </ThemedText>
                <ThemedText style={styles.rowHeader}>
                    End
                </ThemedText>
                <ThemedText style={styles.rowHeader}>
                    Dept
                </ThemedText>
            </ThemedView>
        {props.days.map((day) => {
            return (
            <ThemedView style={styles.row} key={day.date}>
                <RowText 
                        isHighlighted={day.manually_changed}
                        text={(new Date(new Date(day.date).getTime() + 86400000)).toDateString().slice(0, 4)} day={undefined}/>
                <RowText 
                        isHighlighted={day.manually_changed}
                        text={day.date.slice(5, 10)} day={day}/>
                <RowText 
                        canEdit={props.canEdit}
                        isHighlighted={day.manually_changed}
                        text={day.start_time !== "" ? day.start_time : offDaySymbolValue}
                        editType={EditType.START_TIME} day={day}/>
                <RowText 
                        canEdit={props.canEdit}
                        isHighlighted={day.manually_changed}
                        text={day.end_time !== "" ? day.end_time : offDaySymbolValue}
                        editType={EditType.END_TIME} day={day}/>
                <RowText 
                        canEdit={props.canEdit}
                        isHighlighted={day.manually_changed}
                        text={parseAltDept(day.alt_dept)}
                        editType={EditType.ALT_DEPT} day={day}/>
            </ThemedView>
            )
        })}
    </ThemedView>
)}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        padding: 1
    },
    rowText: {
        flex: 1,
        alignSelf: 'stretch',
        fontSize: 13,
        paddingVertical: 5,
    },
    editRowText: {
        flex: 1,
        alignSelf: 'stretch',
        fontSize: 13,
        color: 'white',
        // borderBottomWidth: 1,
        borderColor: 'white'
    },
    highlightedRowText: {
        flex: 1,
        alignSelf: 'stretch',
        fontSize: 13,
        color: '#317B54',
        paddingVertical: 5,
    },
    editHighlightedRowText: {
        flex: 1,
        alignSelf: 'stretch',
        fontSize: 13,
        color: '#317B54',
        borderColor: 'white',
        // borderBottomWidth: 1,
    },
    rowHeader: {
        flex: 1,
        alignSelf: 'stretch',
        fontWeight: 'bold',
    }
})