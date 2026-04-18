import * as _clerk_shared_types from '@clerk/shared/types';
import { Without, APIKeysProps, CreateOrganizationProps, OrganizationListProps, OrganizationProfileProps, OrganizationSwitcherProps, SignInProps, SignUpProps, TaskChooseOrganizationProps, TaskResetPasswordProps, TaskSetupMFAProps, UserAvatarProps, UserButtonProps, UserProfileProps, WaitlistProps, __internal_OAuthConsentProps, HandleOAuthCallbackParams, ShowWhenCondition, PendingSessionOptions, UseAuthReturn } from '@clerk/shared/types';
import React, { ReactNode, PropsWithChildren } from 'react';
import { WithClerkProp, OrganizationProfilePageProps, OrganizationProfileLinkProps, UserProfilePageProps, UserProfileLinkProps, UserButtonActionProps, UserButtonLinkProps } from './types.mjs';

type FallbackProp = {
    /**
     * An optional element to render while the component is mounting.
     */
    fallback?: ReactNode;
};
type UserProfileExportType = typeof _UserProfile & {
    Page: typeof UserProfilePage;
    Link: typeof UserProfileLink;
};
type UserButtonExportType = typeof _UserButton & {
    UserProfilePage: typeof UserProfilePage;
    UserProfileLink: typeof UserProfileLink;
    MenuItems: typeof MenuItems;
    Action: typeof MenuAction;
    Link: typeof MenuLink;
    /**
     * The `<Outlet />` component can be used in conjunction with `asProvider` in order to control rendering
     * of the `<UserButton />` without affecting its configuration or any custom pages that could be mounted
     * @experimental This API is experimental and may change at any moment.
     */
    __experimental_Outlet: typeof UserButtonOutlet;
};
type UserButtonPropsWithoutCustomPages = Without<UserButtonProps, 'userProfileProps' | '__experimental_asStandalone'> & {
    userProfileProps?: Pick<UserProfileProps, 'additionalOAuthScopes' | 'appearance' | 'apiKeysProps'>;
    /**
     * Adding `asProvider` will defer rendering until the `<Outlet />` component is mounted.
     *
     * @experimental This API is experimental and may change at any moment.
     * @default undefined
     */
    __experimental_asProvider?: boolean;
};
type OrganizationProfileExportType = typeof _OrganizationProfile & {
    Page: typeof OrganizationProfilePage;
    Link: typeof OrganizationProfileLink;
};
type OrganizationSwitcherExportType = typeof _OrganizationSwitcher & {
    OrganizationProfilePage: typeof OrganizationProfilePage;
    OrganizationProfileLink: typeof OrganizationProfileLink;
    /**
     * The `<Outlet />` component can be used in conjunction with `asProvider` in order to control rendering
     * of the `<OrganizationSwitcher />` without affecting its configuration or any custom pages that could be mounted
     *
     * @experimental This API is experimental and may change at any moment.
     */
    __experimental_Outlet: typeof OrganizationSwitcherOutlet;
};
type OrganizationSwitcherPropsWithoutCustomPages = Without<OrganizationSwitcherProps, 'organizationProfileProps' | '__experimental_asStandalone'> & {
    organizationProfileProps?: Pick<OrganizationProfileProps, 'appearance'>;
    /**
     * Adding `asProvider` will defer rendering until the `<Outlet />` component is mounted.
     *
     * @experimental This API is experimental and may change at any moment.
     * @default undefined
     */
    __experimental_asProvider?: boolean;
};
declare const SignIn: {
    (props: Without<WithClerkProp<SignInProps & FallbackProp>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
declare const SignUp: {
    (props: Without<WithClerkProp<SignUpProps & FallbackProp>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
declare function UserProfilePage({ children }: PropsWithChildren<UserProfilePageProps>): React.JSX.Element;
declare function UserProfileLink({ children }: PropsWithChildren<UserProfileLinkProps>): React.JSX.Element;
declare const _UserProfile: {
    (props: Without<WithClerkProp<PropsWithChildren<Without<UserProfileProps, "customPages">> & FallbackProp>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
declare const UserProfile: UserProfileExportType;
declare const _UserButton: {
    (props: Without<WithClerkProp<PropsWithChildren<UserButtonPropsWithoutCustomPages> & FallbackProp>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
declare function MenuItems({ children }: PropsWithChildren): React.JSX.Element;
declare function MenuAction({ children }: PropsWithChildren<UserButtonActionProps>): React.JSX.Element;
declare function MenuLink({ children }: PropsWithChildren<UserButtonLinkProps>): React.JSX.Element;
declare function UserButtonOutlet(outletProps: Without<UserButtonProps, 'userProfileProps'>): React.JSX.Element;
declare const UserButton: UserButtonExportType;
declare function OrganizationProfilePage({ children }: PropsWithChildren<OrganizationProfilePageProps>): React.JSX.Element;
declare function OrganizationProfileLink({ children }: PropsWithChildren<OrganizationProfileLinkProps>): React.JSX.Element;
declare const _OrganizationProfile: {
    (props: Without<WithClerkProp<PropsWithChildren<Without<OrganizationProfileProps, "customPages">> & FallbackProp>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
declare const OrganizationProfile: OrganizationProfileExportType;
declare const CreateOrganization: {
    (props: Without<WithClerkProp<CreateOrganizationProps & FallbackProp>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
declare const _OrganizationSwitcher: {
    (props: Without<WithClerkProp<PropsWithChildren<OrganizationSwitcherPropsWithoutCustomPages> & FallbackProp>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
declare function OrganizationSwitcherOutlet(outletProps: Without<OrganizationSwitcherProps, 'organizationProfileProps'>): React.JSX.Element;
declare const OrganizationSwitcher: OrganizationSwitcherExportType;
declare const OrganizationList: {
    (props: Without<WithClerkProp<OrganizationListProps & FallbackProp>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
declare const GoogleOneTap: {
    (props: Without<WithClerkProp<_clerk_shared_types.SignInForceRedirectUrl & _clerk_shared_types.SignUpForceRedirectUrl & {
        cancelOnTapOutside?: boolean;
        itpSupport?: boolean;
        fedCmSupport?: boolean;
        appearance?: _clerk_shared_types.ClerkAppearanceTheme;
    } & FallbackProp>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
declare const Waitlist: {
    (props: Without<WithClerkProp<WaitlistProps & FallbackProp>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
declare const PricingTable: {
    (props: Without<WithClerkProp<{
        for?: _clerk_shared_types.ForPayerType;
        appearance?: _clerk_shared_types.ClerkAppearanceTheme;
        checkoutProps?: Pick<_clerk_shared_types.__internal_CheckoutProps, "appearance">;
    } & {
        ctaPosition?: "top" | "bottom";
        collapseFeatures?: boolean;
        newSubscriptionRedirectUrl?: string;
    } & FallbackProp>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
/**
 * @experimental This component is in early access and may change in future releases.
 */
declare const APIKeys: {
    (props: Without<WithClerkProp<APIKeysProps & FallbackProp>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
declare const OAuthConsent: {
    (props: Without<WithClerkProp<__internal_OAuthConsentProps & FallbackProp>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
declare const UserAvatar: {
    (props: Without<WithClerkProp<UserAvatarProps & FallbackProp>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
declare const TaskChooseOrganization: {
    (props: Without<WithClerkProp<TaskChooseOrganizationProps & FallbackProp>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
declare const TaskResetPassword: {
    (props: Without<WithClerkProp<TaskResetPasswordProps & FallbackProp>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
declare const TaskSetupMFA: {
    (props: Without<WithClerkProp<TaskSetupMFAProps & FallbackProp>, "clerk">): React.JSX.Element | null;
    displayName: string;
};

declare const ClerkLoaded: ({ children }: React.PropsWithChildren<unknown>) => React.ReactNode;
declare const ClerkLoading: ({ children }: React.PropsWithChildren<unknown>) => React.ReactNode;
declare const ClerkFailed: ({ children }: React.PropsWithChildren<unknown>) => React.ReactNode;
declare const ClerkDegraded: ({ children }: React.PropsWithChildren<unknown>) => React.ReactNode;
type ShowProps = React.PropsWithChildren<{
    fallback?: React.ReactNode;
    when: ShowWhenCondition;
} & PendingSessionOptions>;
/**
 * Use `<Show/>` to conditionally render content based on user authorization or sign-in state.
 * Returns `null` while auth is loading. Set `treatPendingAsSignedOut` to treat
 * pending sessions as signed out during that period.
 *
 * The `when` prop supports:
 * - `"signed-in"` or `"signed-out"` shorthands
 * - Authorization descriptors (e.g., `{ permission: "org:billing:manage" }`, `{ role: "admin" }`)
 * - A predicate function `(has) => boolean` that receives the `has` helper
 *
 * @example
 * ```tsx
 * <Show when={{ permission: "org:billing:manage" }} fallback={<p>Unauthorized</p>}>
 *   <BillingSettings />
 * </Show>
 *
 * <Show when={{ role: "admin" }}>
 *   <AdminPanel />
 * </Show>
 *
 * <Show when={(has) => has({ permission: "org:read" }) && isFeatureEnabled}>
 *   <ProtectedFeature />
 * </Show>
 * ```
 *
 */
declare const Show: ({ children, fallback, treatPendingAsSignedOut, when }: ShowProps) => React.ReactNode;
declare const RedirectToSignIn: {
    (props: _clerk_shared_types.Without<WithClerkProp<_clerk_shared_types.SignInRedirectOptions>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
declare const RedirectToSignUp: {
    (props: _clerk_shared_types.Without<WithClerkProp<_clerk_shared_types.SignUpRedirectOptions>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
declare const RedirectToTasks: {
    (props: _clerk_shared_types.Without<WithClerkProp<_clerk_shared_types.TasksRedirectOptions>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
/**
 * @function
 * @deprecated Use [`redirectToUserProfile()`](https://clerk.com/docs/reference/objects/clerk#redirect-to-user-profile) instead.
 */
declare const RedirectToUserProfile: {
    (props: _clerk_shared_types.Without<{
        clerk: _clerk_shared_types.LoadedClerk;
        component?: string;
    }, "clerk">): React.JSX.Element | null;
    displayName: string;
};
/**
 * @function
 * @deprecated Use [`redirectToOrganizationProfile()`](https://clerk.com/docs/reference/objects/clerk#redirect-to-organization-profile) instead.
 */
declare const RedirectToOrganizationProfile: {
    (props: _clerk_shared_types.Without<{
        clerk: _clerk_shared_types.LoadedClerk;
        component?: string;
    }, "clerk">): React.JSX.Element | null;
    displayName: string;
};
/**
 * @function
 * @deprecated Use [`redirectToCreateOrganization()`](https://clerk.com/docs/reference/objects/clerk#redirect-to-create-organization) instead.
 */
declare const RedirectToCreateOrganization: {
    (props: _clerk_shared_types.Without<{
        clerk: _clerk_shared_types.LoadedClerk;
        component?: string;
    }, "clerk">): React.JSX.Element | null;
    displayName: string;
};
declare const AuthenticateWithRedirectCallback: {
    (props: _clerk_shared_types.Without<WithClerkProp<HandleOAuthCallbackParams>, "clerk">): React.JSX.Element | null;
    displayName: string;
};
declare const MultisessionAppSupport: ({ children }: React.PropsWithChildren<unknown>) => React.JSX.Element;

/**
 * @inline
 */
type UseAuthOptions = PendingSessionOptions | undefined | null;
/**
 * The `useAuth()` hook provides access to the current user's authentication state and methods to manage the active session.
 *
 * > [!NOTE]
 * > To access auth data server-side, see the [`Auth` object reference doc](https://clerk.com/docs/reference/backend/types/auth-object).
 *
 * <If sdk="nextjs">
 * By default, Next.js opts all routes into static rendering. If you need to opt a route or routes into dynamic rendering because you need to access the authentication data at request time, you can create a boundary by passing the `dynamic` prop to `<ClerkProvider>`. See the [guide on rendering modes](https://clerk.com/docs/guides/development/rendering-modes) for more information, including code examples.
 * </If>
 *
 * @unionReturnHeadings
 * ["Initialization", "Signed out", "Signed in (no active organization)", "Signed in (with active organization)"]
 *
 * @param [options] - An object containing options for the `useAuth()` hook. `treatPendingAsSignedOut` is a boolean that indicates whether pending sessions are considered as signed out or not. Defaults to `true`.
 *
 * @function
 *
 * @example
 *
 * The following example demonstrates how to use the `useAuth()` hook to access the current auth state, like whether the user is signed in or not. It also includes a basic example for using the `getToken()` method to retrieve a session token for fetching data from an external resource.
 *
 * <Tabs items='React,Next.js'>
 * <Tab>
 *
 * ```tsx {{ filename: 'src/pages/ExternalDataPage.tsx' }}
 * import { useAuth } from '@clerk/react'
 *
 * export default function ExternalDataPage() {
 *   const { userId, sessionId, getToken, isLoaded, isSignedIn } = useAuth()
 *
 *   const fetchExternalData = async () => {
 *     const token = await getToken()
 *
 *     // Fetch data from an external API
 *     const response = await fetch('https://api.example.com/data', {
 *       headers: {
 *         Authorization: `Bearer ${token}`,
 *       },
 *     })
 *
 *     return response.json()
 *   }
 *
 *   if (!isLoaded) {
 *     return <div>Loading...</div>
 *   }
 *
 *   if (!isSignedIn) {
 *     return <div>Sign in to view this page</div>
 *   }
 *
 *   return (
 *     <div>
 *       <p>
 *         Hello, {userId}! Your current active session is {sessionId}.
 *       </p>
 *       <button onClick={fetchExternalData}>Fetch Data</button>
 *     </div>
 *   )
 * }
 * ```
 *
 * </Tab>
 * <Tab>
 *
 * {@include ../../docs/use-auth.md#nextjs-01}
 *
 * </Tab>
 * </Tabs>
 */
declare const useAuth: (options?: UseAuthOptions) => UseAuthReturn;
/**
 * A hook that derives and returns authentication state and utility functions based on the provided auth object.
 *
 * @param authObject - An object containing authentication-related properties and functions.
 *
 * @returns A derived authentication state with helper methods. If the authentication state is invalid, an error is thrown.
 *
 * @remarks
 * This hook inspects session, user, and organization information to determine the current authentication state.
 * It returns an object that includes various properties such as whether the state is loaded, if a user is signed in,
 * session and user identifiers, Organization Roles, and a `has` function for authorization checks.
 * Additionally, it provides `signOut` and `getToken` functions if applicable.
 *
 * @example
 * ```tsx
 * const {
 *   isLoaded,
 *   isSignedIn,
 *   userId,
 *   orgId,
 *   has,
 *   signOut,
 *   getToken
 * } = useDerivedAuth(authObject);
 * ```
 */
declare function useDerivedAuth(authObject: any, { treatPendingAsSignedOut }?: PendingSessionOptions): UseAuthReturn;

export { APIKeys as A, CreateOrganization as C, GoogleOneTap as G, MultisessionAppSupport as M, OAuthConsent as O, PricingTable as P, RedirectToCreateOrganization as R, SignIn as S, TaskChooseOrganization as T, UserAvatar as U, Waitlist as W, OrganizationList as a, OrganizationProfile as b, OrganizationSwitcher as c, SignUp as d, TaskResetPassword as e, TaskSetupMFA as f, UserButton as g, UserProfile as h, AuthenticateWithRedirectCallback as i, ClerkDegraded as j, ClerkFailed as k, ClerkLoaded as l, ClerkLoading as m, RedirectToOrganizationProfile as n, RedirectToSignIn as o, RedirectToSignUp as p, RedirectToTasks as q, RedirectToUserProfile as r, Show as s, type ShowProps as t, useDerivedAuth as u, useAuth as v };
