import PageTitle from '@/components/PageTitle';
import ScheduleList from '@/components/schedule/ScheduleList';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {

  return (
      <ThemedView>
        <PageTitle title={'Current Schedules'}/>
        <ScheduleList showOld={false}/>
      </ThemedView>
  );
}