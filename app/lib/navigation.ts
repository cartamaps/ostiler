import {
  IconUser,
  IconSettings,
  IconPassword,
  IconUsersGroup,
  IconLayoutDashboard,
  IconRepeat,
} from "@tabler/icons-react";

export const navigation = [
  { slug: "/", name: "Dashboard", icon: IconLayoutDashboard },
  { slug: "/queue", name: "Queue", icon: IconRepeat },
  { slug: "/settings", name: "Settings", icon: IconSettings },
];

export const settings = [
  {
    name: "Settings",
    items: [
      {
        slug: "/settings/storage",
        name: "Storage",
        icon: IconUsersGroup,
        end: true,
      },
    ],
  },
  {
    name: "Account Settings",
    items: [
      { slug: "/settings", name: "Account", icon: IconUser },
      {
        slug: "/settings/password",
        name: "Password",
        icon: IconPassword,
      },
    ],
  },
];
