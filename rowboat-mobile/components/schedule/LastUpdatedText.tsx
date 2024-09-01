import { useAtomValue } from "jotai";
import { ThemedText } from "../ThemedText";
import { StyleSheet, StatusBar } from "react-native";
import { lastUpdatedAtom } from "@/api/ScheduleStore";

export default function LastUpdatedText() {
    const lastUpdatedValue = useAtomValue(lastUpdatedAtom);

    return (<>
        {lastUpdatedValue.length !== 0 && <ThemedText style={styles.lastUpdated}>Schedules last updated on {lastUpdatedValue}</ThemedText>}
        </>
    )
}

const styles = StyleSheet.create({
    lastUpdated: {
        alignSelf: 'center',
        marginTop: '110%'
    }
  });