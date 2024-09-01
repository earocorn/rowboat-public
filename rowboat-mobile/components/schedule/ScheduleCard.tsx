import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { Alert, StyleSheet } from "react-native";
import ScheduleTable from "./ScheduleTable";
import { Day, DayPatch, Schedule } from "@/api/Models";
import { useState } from "react";
import { ThemedButton } from "../ThemedButton";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { daysAtom, patchDaysAtom } from "@/api/ScheduleStore";
import { fetchDays, patchDays } from "@/api/Api";

const ScheduleCard: React.FC<Schedule> = (schedule: Schedule) => {
    const [editable, setEditable] = useState(false);
    const patchDaysValue = useAtomValue(patchDaysAtom);
    const setDays = useSetAtom(daysAtom);
    const setPatchDays = useSetAtom(patchDaysAtom);

    async function replaceDays() {
        setDays((atomDays) => atomDays?.filter((day) => day.week_id !== schedule.week.week_id));
    }

    async function populateDays() {
        const data = await fetchDays(schedule.week.week_id);
        setDays((days) => {
            return days ? days.concat(data) : data;
        });
    }

    function clearCurrentWeekPatchDays() {
        console.log("Old patch days: " + JSON.stringify(patchDaysValue.values()));
        const tempPatchDays = patchDaysValue;
        schedule.days?.forEach((day) => tempPatchDays.delete(day.day_id));
        setPatchDays(() => tempPatchDays);
        console.log("New patch days: " + JSON.stringify(patchDaysValue.values()));
    }

    async function sendPatchRequest() {
        const allPatchDays = Array.from(patchDaysValue.values());
        const days = allPatchDays.filter((day) => schedule.days?.find((patchDay) => patchDay.day_id == day.day_id));
        console.log("About to patch: " + days);
        const numDaysPatched = await patchDays(days);
        Alert.alert(numDaysPatched > 0 ? "Success" : "Failure", `${numDaysPatched} days have been updated`);
    }

    function cancelEdit() {
        clearCurrentWeekPatchDays();
        setEditable(false);
    }

    const createSaveConfirmation = () => Alert.alert('', 'Are you sure you want to save?', [
        {
            text: 'Yes',
            onPress: () => {
                sendPatchRequest();
                clearCurrentWeekPatchDays();
                replaceDays();
                populateDays();
            },
        },
        {
            text: 'No',
            onPress: () => {

            },
            style: 'cancel'
        }
    ])

    return (
    <ThemedView style={styles.card}>
        <ThemedView style={styles.titleContainer}>
            <ThemedText style={styles.title}>
                {`Week of ${(new Date(new Date(schedule.week.week_of).getTime() + 86400000)).toLocaleDateString()} `}
            </ThemedText>
            <ThemedView style={styles.buttonGroup}>
                <ThemedView style={styles.buttonContainer}>
                    {schedule.days !== null && schedule.days.length > 0 && !editable && (<ThemedButton color={editable ? "#317B54" : ""} onPress={() => setEditable(true)} title={"edit"}/>)}
                    {schedule.days && schedule.days.length > 0 && editable && (<ThemedButton onPress={createSaveConfirmation} title={"save"}/>)}
                </ThemedView>
                <ThemedView style={styles.buttonContainer}>
                    {schedule.days && schedule.days.length > 0 && editable && (<ThemedButton color={"darkred"} onPress={() => cancelEdit()} title={"cancel"}/>)}
                </ThemedView>
            </ThemedView>
        </ThemedView>
        {schedule.days !== null && schedule.days.length > 0 ? (<>
            <ScheduleTable days={schedule.days} canEdit={editable}/>
            <ThemedText style={ { alignSelf: 'flex-end' } }>{`${schedule.week.total_hours} hours`}</ThemedText>
            </>) : (
                <ThemedButton title="Show schedule" onPress={() => populateDays()}/>
            )
        }
    </ThemedView>
)};

const styles = StyleSheet.create({
    title: {
        fontSize: 20,
        alignSelf: 'center'
    },
    card: {
        width: '100%',
        alignSelf: 'stretch',
        padding: 10,
        // marginVertical: 8,
    }, 
    titleContainer: {
        justifyContent: 'center',
        flexDirection: 'row',
        paddingBottom: 5
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    buttonContainer: {
        paddingHorizontal: 5
    }
})

export default ScheduleCard