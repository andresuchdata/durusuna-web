import { http } from "@/core/http/axios";
import type {
  BatchCreateUsersPayload,
  ContactsResponse,
  CreateUserPayload,
  GetContactsParams,
  UpdateUserPayload,
  User,
  UserListQuery,
  UserListResponse,
} from "./types";

export async function listUsers(params?: UserListQuery): Promise<UserListResponse> {
  const { data } = await http().get("/users", {
    params: {
      page: params?.page,
      limit: params?.limit,
      search: params?.search,
      userType: params?.userType,
      isActive: params?.isActive,
      dobFrom: params?.dobFrom,
      dobTo: params?.dobTo,
    },
  });
  return data as UserListResponse;
}

export async function getUser(id: string): Promise<User> {
  const { data } = await http().get(`/users/${id}`);
  // Backend returns { success: true, user }
  return (data.user || data) as User;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await http().post("/users", payload);
  // Backend returns { success: true, user }
  return (data.user || data) as User;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const { data } = await http().put(`/users/${id}`, payload);
  // Backend returns { success: true, user }
  return (data.user || data) as User;
}

export async function deleteUser(id: string): Promise<void> {
  await http().delete(`/users/${id}`);
}

export async function batchCreateUsers(payload: BatchCreateUsersPayload): Promise<User[]> {
  const { data } = await http().post("/users/batch", payload);
  return data.users as User[];
}

export async function getContacts(params?: GetContactsParams): Promise<ContactsResponse> {
  const { data } = await http().get("/users/contacts", {
    params: {
      page: params?.page || 1,
      limit: params?.limit || 50,
      search: params?.search,
      userType: params?.userType,
    },
  });
  return data as ContactsResponse;
}

