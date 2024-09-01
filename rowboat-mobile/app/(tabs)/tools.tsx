import { requestUpdateSchedules } from "@/api/Api";
import { offDaySymbols } from "@/api/Models";
import { offDaySymbolAtom } from "@/api/ScheduleStore";
import PageTitle from "@/components/PageTitle";
import LastUpdatedText from "@/components/schedule/LastUpdatedText";
import { ThemedButton } from "@/components/ThemedButton";
import { ThemedView } from "@/components/ThemedView";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "@react-native-firebase/messaging";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { Alert, Linking, StatusBar, StyleSheet } from "react-native";
import { defaultAppMessaging } from "./_layout";

export default function ToolsScreen() {
    const offDaySymbolValue = useAtomValue(offDaySymbolAtom);
    const setOffDaySymbol = useSetAtom(offDaySymbolAtom);
    const [count, setCount] = useState(1);

    async function checkRequest() {
        const response = await requestUpdateSchedules();
        const responseJson = await response.json();
        const messageString = responseJson.message;

        if(response.status == 200) {
            Alert.alert("Success", messageString);
        } else if(response.status == 425){
            Alert.alert("Sorry", messageString);
        } else {
            Alert.alert("Error", messageString);
        }
    }

    function callCustomerService() {
        Linking.openURL(`tel:2566316784`)
    }
 
    async function cycleOffDaySymbols() {
        setOffDaySymbol((symbol) => symbol = offDaySymbols[count]);
        try {
            await AsyncStorage.setItem('offDaySymbol', offDaySymbols[count]);
        } catch (e) {
            console.error(e);
        }
        setCount(count + 1);
        if(count >= offDaySymbols.length-1) {
            setCount(0);
        }
    };

    async function temporaryFunc() {
      const token = await getToken(defaultAppMessaging);
      Alert.alert("sowwy 🥺", "Not yet implemented. Try again next week :3. Anyways, here's ur push token! " + token);
    }

    return (
        <>
        <ThemedView style={styles.screen}>
          <PageTitle title={'Tools'}/>
          <ThemedView style={styles.buttonGroup}>
            <ThemedView style={styles.buttonContainer}>
                <ThemedButton title="Fetch New Schedules" onPress={() => checkRequest()}/>
            </ThemedView>
            <ThemedView style={styles.buttonContainer}>
                <ThemedButton title="Customer Service" onPress={() => callCustomerService()}/>
            </ThemedView>
            <ThemedView style={styles.buttonContainer}>
                <ThemedButton title="Requests tracker" onPress={() => temporaryFunc()}/>
            </ThemedView>
            <ThemedView style={styles.buttonContainer}>
                <ThemedButton title={`Off Days : ${offDaySymbolValue}`} onPress={() => cycleOffDaySymbols()}/>
            </ThemedView>
          </ThemedView>
          <LastUpdatedText/>
        </ThemedView>
        </>
    );
}

const styles = StyleSheet.create({
    title: {
      padding: 10,
      marginTop: StatusBar.currentHeight != undefined 
      ? StatusBar.currentHeight + 30 : 30
    },
    buttonGroup: {
        padding: 10,
    },
    buttonContainer: {
        padding: 10
    },
    screen: {
        padding: 10,
        height: '100%',
    }
  });