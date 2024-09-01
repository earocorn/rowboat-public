import PageTitle from '@/components/PageTitle';
import ScheduleList from '@/components/schedule/ScheduleList';
import { ThemedView } from '@/components/ThemedView';

export default function HistoryScreen() {

  return (
      <ThemedView>
        <PageTitle title={'History'}/>
        <ScheduleList showOld={true}/>
      </ThemedView>
  );
}