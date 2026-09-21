/**
 * Disable OS font scaling app-wide (iOS Dynamic Type / Android font size).
 *
 * The app sizes text via its own responsive system, so letting the OS scale
 * on top makes text uneven between devices. Sets allowFontScaling=false as the
 * default for every Text/TextInput, including third-party components.
 */
import { Text, TextInput } from 'react-native';

type WithDefaults = { defaultProps?: { allowFontScaling?: boolean } };

const TextWithDefaults = Text as unknown as WithDefaults;
TextWithDefaults.defaultProps = TextWithDefaults.defaultProps || {};
TextWithDefaults.defaultProps.allowFontScaling = false;

const TextInputWithDefaults = TextInput as unknown as WithDefaults;
TextInputWithDefaults.defaultProps = TextInputWithDefaults.defaultProps || {};
TextInputWithDefaults.defaultProps.allowFontScaling = false;
