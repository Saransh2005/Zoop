export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
  JoinMeeting: { meetingId?: string } | undefined;
  ScheduleMeeting: undefined;
  MeetingRoom: {
    meetingId: string;
    displayName: string;
    isHost?: boolean;
    initialMuted?: boolean;
    initialCameraOff?: boolean;
  };
};

export type MainTabParamList = {
  MeetChat: undefined;
  Meetings: undefined;
  Settings: undefined;
};
