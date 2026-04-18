import {
  ClerkProvider,
  IS_REACT_SHARED_VARIANT_COMPATIBLE,
  MultisessionAppSupport
} from "./chunk-UGIUIDGG.mjs";
import {
  OAuthConsent,
  incompatibleRoutingWithPathProvidedError,
  noPathProvidedError,
  useDerivedAuth
} from "./chunk-JI6JEZDU.mjs";
import {
  errorThrower,
  setErrorThrowerOptions
} from "./chunk-RQWALB2R.mjs";
import "./chunk-E5QRIS4Z.mjs";

// src/internal.ts
import { useOAuthConsent } from "@clerk/shared/react";

// src/hooks/useRoutingProps.ts
function useRoutingProps(componentName, props, routingOptions) {
  const path = props.path || (routingOptions == null ? void 0 : routingOptions.path);
  const routing = props.routing || (routingOptions == null ? void 0 : routingOptions.routing) || "path";
  if (routing === "path") {
    if (!path) {
      return errorThrower.throw(noPathProvidedError(componentName));
    }
    return {
      ...routingOptions,
      ...props,
      routing: "path"
    };
  }
  if (props.path) {
    return errorThrower.throw(incompatibleRoutingWithPathProvidedError(componentName));
  }
  return {
    ...routingOptions,
    ...props,
    path: void 0
  };
}

// src/internal.ts
import {
  clerkJSScriptUrl,
  buildClerkJSScriptAttributes,
  clerkUIScriptUrl,
  buildClerkUIScriptAttributes,
  setClerkJSLoadingErrorPackageName,
  clerkJsScriptUrl,
  buildClerkJsScriptAttributes,
  setClerkJsLoadingErrorPackageName
} from "@clerk/shared/loadClerkJsScript";
var InternalClerkProvider = ClerkProvider;
export {
  IS_REACT_SHARED_VARIANT_COMPATIBLE,
  InternalClerkProvider,
  MultisessionAppSupport,
  OAuthConsent,
  buildClerkJSScriptAttributes,
  buildClerkJsScriptAttributes,
  buildClerkUIScriptAttributes,
  clerkJSScriptUrl,
  clerkJsScriptUrl,
  clerkUIScriptUrl,
  setClerkJSLoadingErrorPackageName,
  setClerkJsLoadingErrorPackageName,
  setErrorThrowerOptions,
  useDerivedAuth,
  useOAuthConsent,
  useRoutingProps
};
//# sourceMappingURL=internal.mjs.map