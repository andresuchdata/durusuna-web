import { http } from "@/core/http/axios";
import type { ContactsResponse, GetContactsParams } from "./types";

export async function getContacts(params?: GetContactsParams): Promise<ContactsResponse> {
  const { data } = await http().get("/users/contacts", {
    params: {
      page: params?.page || 1,
      limit: params?.limit || 50,
      search: params?.search,
      userType: params?.userType,
    },
  });
  return data;
}

