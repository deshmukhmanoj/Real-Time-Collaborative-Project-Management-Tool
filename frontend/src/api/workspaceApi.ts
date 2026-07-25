import { baseApi } from './baseApi';
import { ApiSuccess, Workspace, WorkspaceMember, WorkspaceRole } from '@/types';

export const workspaceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyWorkspaces: builder.query<ApiSuccess<Workspace[]>, void>({
      query: () => '/workspaces',
      providesTags: ['Workspace'],
    }),
    createWorkspace: builder.mutation<ApiSuccess<{ id: number; name: string }>, { name: string }>(
      {
        query: (body) => ({ url: '/workspaces', method: 'POST', body }),
        invalidatesTags: ['Workspace'],
      }
    ),
    getWorkspaceMembers: builder.query<ApiSuccess<WorkspaceMember[]>, number>({
      query: (workspaceId) => `/workspaces/${workspaceId}/members`,
      providesTags: ['WorkspaceMembers'],
    }),
    addWorkspaceMember: builder.mutation<
      ApiSuccess<unknown>,
      { workspaceId: number; userId: number; role: WorkspaceRole }
    >({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/members`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WorkspaceMembers'],
    }),
  }),
});

export const {
  useGetMyWorkspacesQuery,
  useCreateWorkspaceMutation,
  useGetWorkspaceMembersQuery,
  useAddWorkspaceMemberMutation,
} = workspaceApi;
