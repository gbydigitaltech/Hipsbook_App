export type ToSResponse = {
  id: string;
  key: 'ToS' | string;
  value: string;
  create_by_personal_info: unknown | null;
  modify_by_personal_info: {
    modify_by: string;
    name: string;
    modify_timestamp: string;
  } | null;
};
