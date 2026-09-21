import { yupResolver } from '@hookform/resolvers/yup';
import { log } from '../../helpers/logger';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Keyboard,
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AvoidSoftInput } from 'react-native-avoid-softinput';
import DatePicker from 'react-native-date-picker';
import { launchImageLibrary } from 'react-native-image-picker';

import CalendarIcon from '../../assets/icons/CalendarIcon';
import AppBackground from '../../components/background/AppBackground';
import AppButton from '../../components/buttons/AppButton';
import AppTextInputController from '../../components/inputs/AppTextInputController';
import AppLoadingOverlay from '../../components/loading/AppLoadingOverlay';
import RoundProfileImage from '../../components/profiles/RoundProfileImage';
import AppText from '../../components/texts/AppText';
import AppScrollView from '../../components/views/AppScrollView';
import { IS_Android, IS_IOS, IS_TABLET } from '../../constants/platform';
import {
  ddmmyyyyToEpochUTC,
  formatDateDDMMYYYY,
} from '../../helpers/dateHelper';
import { useResponsive } from '../../helpers/responsive';
import { useProfile } from '../../stores/profile';
import { AppColors } from '../../styles/colors';
import { AppFontSize } from '../../styles/sharedstyles';
import { ProfileStackParamList } from '../../types/data/navigation/navigation.types';
import {
  ProfileForm,
  UploadProfileImageResponse,
} from '../../types/data/profile/profile.types';
import { editProfileSchema } from '../../validation/profile/editProfileSchema';
import AppScreenHeader from '../../components/sections/AppScreenHeader';

/**
 * Parse profile DOB from either:
 * - epoch string (e.g. "1704067200000")
 * - ISO/date string
 */
function parseDOB(raw?: string): Date | null {
  if (!raw) return null;
  const s = String(raw).trim();
  const d = /^\d+$/.test(s) ? new Date(Number(s)) : new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

type ProfileNavStackProp = StackNavigationProp<
  ProfileStackParamList,
  'EditProfile'
>;

type FieldKey = 'firstName' | 'lastName' | 'email' | 'phone' | 'birthday';

export default function ProfileEditInfoScreen() {
  const navigation = useNavigation<ProfileNavStackProp>();
  const { scale, verticalScale } = useResponsive();

  const profile = useProfile(s => s.profile);
  const updateProfile = useProfile(s => s.updateProfile);
  const uploadProfileImage = useProfile(s => s.uploadProfileImage);

  const isFetchingProfile = useProfile(s => s.isFetchingProfile);
  const isUpdatingProfile = useProfile(s => s.isUpdatingProfile);
  const isUploadingProfileImage = useProfile(s => s.isUploadingProfileImage);

  const [openDate, setOpenDate] = useState(false);
  const [safeDate, setSafeDate] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);
  const [isSavingProfileImage, setIsSavingProfileImage] = useState(false);

  const todayEnd = new Date();
  const didPrefillRef = useRef(false);

  const scrollRef = useRef<any>(null);
  const fieldPositionsRef = useRef<Record<FieldKey, number>>({
    firstName: 0,
    lastName: 0,
    email: 0,
    phone: 0,
    birthday: 0,
  });

  const setFieldPosition = (key: FieldKey) => (e: LayoutChangeEvent) => {
    fieldPositionsRef.current[key] = e.nativeEvent.layout.y;
  };

  const scrollToField = (key: FieldKey) => {
    const y = fieldPositionsRef.current[key] ?? 0;
    scrollRef.current?.scrollTo?.({
      y: Math.max(0, y - verticalScale(110)),
      animated: true,
    });
  };

  useFocusEffect(
    useCallback(() => {
      AvoidSoftInput.setEnabled(true);
      AvoidSoftInput.setAvoidOffset(IS_Android ? 64 : 0);

      return () => {
        AvoidSoftInput.setAvoidOffset(0);
        AvoidSoftInput.setEnabled(false);
      };
    }, []),
  );

  const {
    control,
    handleSubmit,
    setValue,
    trigger,
    clearErrors,
    reset,
    watch,
  } = useForm<ProfileForm>({
    resolver: yupResolver(editProfileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthday: '',
      profile_image: null,
    },
    mode: 'onChange',
  });

  const watchedProfileImage = watch('profile_image');

  const prevProfileRef = useRef(profile);
  useEffect(() => {
    if (profile) prevProfileRef.current = profile;
  }, [profile]);

  const displayProfile = profile ?? prevProfileRef.current;

  useEffect(() => {
    if (!displayProfile || didPrefillRef.current) return;

    const dob = parseDOB(displayProfile.date_of_birth);

    reset({
      firstName: displayProfile.first_name ?? '',
      lastName: displayProfile.last_name ?? '',
      email: displayProfile.email ?? '',
      phone: displayProfile.phone_number ?? '',
      birthday: dob ? formatDateDDMMYYYY(dob) : '',
      profile_image: displayProfile.profile_image ?? null,
    });

    if (dob) setSafeDate(dob);
    didPrefillRef.current = true;
  }, [displayProfile, reset]);

  const setBirthdayFromDate = (d: Date) => {
    setSafeDate(d);
    setValue('birthday', formatDateDDMMYYYY(d), { shouldDirty: true });
    trigger('birthday');
  };

  const handleOpenBirthdayPicker = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      setOpenDate(true);
    }, 150);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        rootView: { flex: 1 },
        profileImage: {
          marginTop: verticalScale(16),
          alignItems: 'center',
        },
        changePhotoText: {
          marginTop: verticalScale(12),
          color: AppColors.white,
        },
        formContainer: {
          marginTop: verticalScale(IS_TABLET ? 10 : 6),
          gap: verticalScale(IS_TABLET ? 4 : 2),
        },
        buttonContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: scale(12),
          marginTop: verticalScale(10),
        },
        button: {
          flex: 1,
        },
        buttonContent: {
          paddingVertical: verticalScale(IS_IOS ? 18 : 16),
        },
      }),
    [scale, verticalScale],
  );

  const getExistingDobForPayload = () => {
    const existingDob = parseDOB(displayProfile?.date_of_birth);
    return existingDob ? String(existingDob.getTime()) : undefined;
  };

  const saveProfileImageOnly = async (imageUrl: string) => {
    await updateProfile({
      first_name: displayProfile?.first_name?.trim() ?? '',
      last_name: displayProfile?.last_name?.trim() ?? '',
      phone_number: displayProfile?.phone_number?.trim() ?? '',
      date_of_birth: getExistingDobForPayload(),
      profile_image: imageUrl,
    });

    setValue('profile_image', imageUrl, {
      shouldDirty: true,
      shouldValidate: false,
    });
  };

  const handlePickProfileImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        includeBase64: false,
        quality: 0.8,
      });

      if (result.didCancel) return;

      if (result.errorCode) {
        Alert.alert(
          'เกิดข้อผิดพลาด',
          result.errorMessage || 'ไม่สามารถเลือกรูปได้',
        );
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      const file = {
        uri: asset.uri,
        name: asset.fileName ?? `profile_${Date.now()}.jpg`,
        type: asset.type ?? 'image/jpeg',
      };

      setIsSavingProfileImage(true);

      const response: UploadProfileImageResponse = await uploadProfileImage(
        file,
      );

      if (!response?.url) {
        Alert.alert(
          'เกิดข้อผิดพลาด',
          'อัปโหลดสำเร็จ แต่ไม่พบ URL รูปภาพจาก server',
        );
        return;
      }

      await saveProfileImageOnly(response.url);

      Alert.alert('สำเร็จ', 'เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว');
    } catch (err) {
      log('Profile', err);
      Alert.alert(
        'เกิดข้อผิดพลาด',
        err instanceof Error ? err.message : 'ไม่สามารถอัปโหลดรูปโปรไฟล์ได้',
      );
    } finally {
      setIsSavingProfileImage(false);
    }
  };

  const onSubmit = async (values: ProfileForm) => {
    try {
      setSaving(true);

      await updateProfile({
        first_name: values.firstName?.trim(),
        last_name: values.lastName?.trim(),
        phone_number: values.phone?.trim(),
        date_of_birth: ddmmyyyyToEpochUTC(values.birthday),
        profile_image: values.profile_image ?? null,
      });

      setSaving(false);
      Alert.alert('สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว', [
        { text: 'ตกลง', onPress: () => navigation.goBack() },
      ]);
    } catch {
      setSaving(false);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่');
    }
  };

  const profileImageUrl =
    typeof watchedProfileImage === 'string' && watchedProfileImage
      ? watchedProfileImage
      : typeof displayProfile?.profile_image === 'string' &&
        displayProfile.profile_image
      ? displayProfile.profile_image
      : undefined;

  const profileDisplayName =
    displayProfile?.first_name?.trim() ||
    displayProfile?.email?.trim() ||
    'Profile';

  const isBusy =
    saving ||
    isSavingProfileImage ||
    isUpdatingProfile ||
    isUploadingProfileImage;

  return (
    <View style={styles.rootView}>
      <AppBackground pointerEvents="none" />

      <AppScrollView
        ref={scrollRef}
        withHorizontalPadding
        keyboardShouldPersistTaps="handled"
      >
        <AppScreenHeader title="แก้ไขโปรไฟล์" />

        <View style={styles.profileImage}>
          <RoundProfileImage
            name={profileDisplayName}
            imageUrl={profileImageUrl}
            onPress={handlePickProfileImage}
            disabled={isBusy}
            size={IS_TABLET ? 110 : 90}
          />

          <AppText fontSize={AppFontSize.body} style={styles.changePhotoText}>
            แตะเพื่อเปลี่ยนรูปโปรไฟล์
          </AppText>
        </View>

        <View style={styles.formContainer}>
          <View onLayout={setFieldPosition('firstName')}>
            <AppTextInputController
              control={control}
              name="firstName"
              label="ชื่อ"
              labelFontSize={IS_TABLET ? 20 : 16}
              fontSize={AppFontSize.subtitle}
              errorFontSize={IS_TABLET ? 14 : 12}
              placeholder="กรุณากรอกชื่อ"
              inputProps={{
                inputWrapperStyle: {
                  minHeight: verticalScale(IS_TABLET ? 64 : 54),
                },
                returnKeyType: 'next',
                blurOnSubmit: false,
                onFocus: () => scrollToField('firstName'),
              }}
            />
          </View>

          <View onLayout={setFieldPosition('lastName')}>
            <AppTextInputController
              control={control}
              name="lastName"
              labelFontSize={IS_TABLET ? 20 : 16}
              fontSize={AppFontSize.subtitle}
              errorFontSize={IS_TABLET ? 14 : 12}
              label="นามสกุล"
              placeholder="กรุณากรอกนามสกุล"
              inputProps={{
                inputWrapperStyle: {
                  minHeight: verticalScale(IS_TABLET ? 64 : 54),
                },
                returnKeyType: 'next',
                blurOnSubmit: false,
                onFocus: () => scrollToField('lastName'),
              }}
            />
          </View>

          <View onLayout={setFieldPosition('email')}>
            <AppTextInputController
              control={control}
              name="email"
              label="อีเมล"
              labelFontSize={IS_TABLET ? 20 : 16}
              fontSize={AppFontSize.subtitle}
              errorFontSize={IS_TABLET ? 14 : 12}
              placeholder="กรุณากรอกอีเมล"
              inputProps={{
                inputWrapperStyle: {
                  minHeight: verticalScale(IS_TABLET ? 64 : 54),
                },
                autoCapitalize: 'none',
                keyboardType: 'email-address',
                editable: false,
                selectTextOnFocus: false,
              }}
            />
          </View>

          <View onLayout={setFieldPosition('phone')}>
            <AppTextInputController
              control={control}
              name="phone"
              label="เบอร์โทรศัพท์"
              labelFontSize={IS_TABLET ? 20 : 16}
              fontSize={AppFontSize.subtitle}
              errorFontSize={IS_TABLET ? 14 : 12}
              placeholder="กรุณากรอกเบอร์โทรศัพท์"
              inputProps={{
                inputWrapperStyle: {
                  minHeight: verticalScale(IS_TABLET ? 64 : 54),
                },
                keyboardType: 'phone-pad',
                maxLength: 10,
                returnKeyType: 'done',
                onFocus: () => scrollToField('phone'),
                onEndEditing: async (e: any) => {
                  const value = e?.nativeEvent?.text?.trim() ?? '';
                  if (value) await trigger('phone');
                  else clearErrors('phone');
                },
              }}
            />
          </View>

          <View onLayout={setFieldPosition('birthday')}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {
                scrollToField('birthday');
                handleOpenBirthdayPicker();
              }}
            >
              <View pointerEvents="none">
                <AppTextInputController
                  control={control}
                  name="birthday"
                  label="วันเกิด"
                  placeholder="เลือกวัน"
                  formatValue={v => (typeof v === 'string' ? v : '')}
                  labelFontSize={IS_TABLET ? 20 : 16}
                  fontSize={AppFontSize.subtitle}
                  errorFontSize={IS_TABLET ? 14 : 12}
                  inputProps={{
                    inputWrapperStyle: {
                      minHeight: verticalScale(IS_TABLET ? 64 : 54),
                    },
                    editable: false,
                    rightIcon: <CalendarIcon size={IS_TABLET ? 24 : 20} />,
                  }}
                />
              </View>
            </TouchableOpacity>
          </View>

          <DatePicker
            modal
            open={openDate}
            date={safeDate}
            mode="date"
            locale="th"
            confirmText="ยืนยัน"
            cancelText="ยกเลิก"
            maximumDate={todayEnd}
            onConfirm={d => {
              setBirthdayFromDate(d);
              setOpenDate(false);
            }}
            onCancel={() => setOpenDate(false)}
          />

          <View style={styles.buttonContainer}>
            <AppButton
              title="ยกเลิก"
              fontSize={AppFontSize.subtitle}
              secondary
              containerStyle={styles.button}
              contentStyle={styles.buttonContent}
              onPress={() => navigation.goBack()}
              disabled={isBusy}
            />
            <AppButton
              title="บันทึก"
              fontSize={AppFontSize.subtitle}
              onPress={handleSubmit(onSubmit)}
              containerStyle={styles.button}
              loading={isBusy}
              disabled={isBusy}
              contentStyle={styles.buttonContent}
            />
          </View>
        </View>
      </AppScrollView>

      <AppLoadingOverlay
        visible={isBusy || (isFetchingProfile && !displayProfile)}
        message={
          isSavingProfileImage
            ? 'กำลังบันทึกรูปโปรไฟล์...'
            : saving
            ? 'กำลังบันทึกข้อมูล...'
            : 'กำลังโหลดโปรไฟล์...'
        }
      />
    </View>
  );
}
