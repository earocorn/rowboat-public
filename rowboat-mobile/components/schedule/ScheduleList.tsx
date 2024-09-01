import { Dimensions, FlatList, RefreshControl, StyleSheet } from "react-native";
import ScheduleCard from "./ScheduleCard";
import { Schedule } from "@/api/Models";
import { useAtom } from "jotai";
import { useSetAtom } from "jotai/react";
import { daysAtom, schedulesAtom, weeksAtom } from "@/api/ScheduleStore";
import React from "react";
import { fetchWeeks } from "@/api/Api";

interface ListProps {
    showOld: boolean,
}

export default function ScheduleList(props: ListProps) {
    const [schedules, ] = useAtom(schedulesAtom);
    const setDays = useSetAtom(daysAtom);
    const setWeeks = useSetAtom(weeksAtom);
    const [refreshing, setRefreshing] = React.useState(false);

    const onRefresh = React.useCallback(() => {
      setRefreshing(true);
      setTimeout(async () => {
        setRefreshing(false);
        const fetchedWeeks = await fetchWeeks();
        setWeeks(() => fetchedWeeks);
        setDays(() => []);
      }, 1000);
    }, []);
    
    return ((
        <FlatList
              contentContainerStyle={{ justifyContent:'center' }}
              style={styles.scheduleContainer}
              data={!props.showOld ? schedules.filter((schedule) => schedule.week.has_passed == props.showOld)
                : schedules.filter((schedule) => schedule.week.has_passed == props.showOld).reverse()
              }
              renderItem={(schedule) => <ScheduleCard week={schedule.item.week} days={schedule.item.days}/>}
              keyExtractor={(schedule: Schedule) => schedule.week.week_id.toString()}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
              }
              />))
}

const styles = StyleSheet.create({
  scheduleContainer: {
    padding: 10,
    height: '87%'
  },
});