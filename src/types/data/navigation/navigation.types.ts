// ---------- Root Navigator ----------

/** Root navigator routes */
export type RootStackParamList = {
  AuthStack: undefined;
  AppStack: undefined;
};

// ---------- Bottom Tabs ----------

/** Bottom tab navigator routes */
export type BottomTabParamList = {
  Home: undefined;

  Course:
    | {
        initialTag?: string;
        initialCategoryIds?: string[];
        initialTitle?: string;
      }
    | undefined;
  Live: undefined;
  MyCourse: undefined;
  Profile: undefined;
};

// ---------- Auth Stack ----------

/** Authentication stack routes */
export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;

  /** OTP confirmation */
  ConfirmOTP: {
    email: string;
  };
};

// ---------- Profile Stack ----------

/** Profile stack routes */
export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;

  ProfileAddress: undefined;

  ProfileManageAddress: {
    id?: string;
  };

  ProfileChangePassword: undefined;
};

// ---------- App Stack ----------

/** Main application stack */
export type AppStackParamList = {
  MainTabs?:
    | {
        screen?: keyof BottomTabParamList;
        params?: BottomTabParamList[keyof BottomTabParamList];
      }
    | undefined;

  EditProfile: undefined;

  ProfileAddress: undefined;

  ProfileManageAddress: {
    id?: string;
  };

  ProfileChangePassword: undefined;

  CourseDetail: {
    id?: string;
  };


  ClassRoom: {
    id: string;

    autoPickFirstActivated?: boolean;
    lessonId?: string;
    mediaId?: string;

    autoStart?: boolean;

    openPdfUrl?: string;
  };

  TeacherProfile: {
    id?: string;
  };

  About: undefined;

  TermOfService: undefined;

  PrivacyPolicy: undefined;
};
