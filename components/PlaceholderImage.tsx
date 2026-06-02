import React from "react";
import { Image, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface Props {
    style?: StyleProp<ViewStyle>;
    logoSize?: number;
    children?: React.ReactNode;
}

export default function PlaceHolderImage({ style, logoSize = 28, children }: Props) {
    return (
        <View style={[styles.container, style]}>
            <Image
                source={require('@/assets/images/barb-logo.png')}
                style={{ width: logoSize, height: logoSize, opacity: 0.2 }}
                resizeMode="contain"
            />
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center' }
});