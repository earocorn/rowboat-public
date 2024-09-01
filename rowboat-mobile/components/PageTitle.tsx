import { StatusBar, StyleSheet } from "react-native"
import { ThemedText } from "./ThemedText"

interface TitleProps {
    title: string
}

export default function PageTitle(props: TitleProps) {

    return(
        <ThemedText type='title' style={[{ alignSelf:'center' }, styles.title]}>
            {props.title}
          </ThemedText>)
}


const styles = StyleSheet.create({
    title: {
        marginTop: StatusBar.currentHeight != undefined 
        ? StatusBar.currentHeight + 30 : 30
    }
  })