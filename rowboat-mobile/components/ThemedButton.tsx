import { Button, Pressable, type ButtonProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedButtonProps = ButtonProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedButton({ color, lightColor, darkColor, ...otherProps }: ThemedButtonProps) {
  return <Button color={color ? color : '#014421'} {...otherProps}/>;
}
