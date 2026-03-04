"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  center?: boolean;
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12L12 3l9 9"
        stroke={active ? "#0A84FF" : "#8E8E93"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 10v9a1 1 0 001 1h4v-4h4v4h4a1 1 0 001-1v-9"
        stroke={active ? "#0A84FF" : "#8E8E93"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RoutinesIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
        stroke={active ? "#0A84FF" : "#8E8E93"}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="9"
        y="3"
        width="6"
        height="4"
        rx="1"
        stroke={active ? "#0A84FF" : "#8E8E93"}
        strokeWidth="2"
      />
      <path
        d="M9 12h6M9 16h4"
        stroke={active ? "#0A84FF" : "#8E8E93"}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WorkoutIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#0A84FF" />
      <polygon points="10,8 16,12 10,16" fill="white" />
    </svg>
  );
}

function ProgressIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <polyline
        points="22 12 18 12 15 21 9 3 6 12 2 12"
        stroke={active ? "#0A84FF" : "#8E8E93"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke={active ? "#0A84FF" : "#8E8E93"}
        strokeWidth="2"
      />
      <path
        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke={active ? "#0A84FF" : "#8E8E93"}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: (active) => <HomeIcon active={active} />,
  },
  {
    href: "/routines",
    label: "Routines",
    icon: (active) => <RoutinesIcon active={active} />,
  },
  {
    href: "/workout",
    label: "Workout",
    icon: () => <WorkoutIcon />,
    center: true,
  },
  {
    href: "/progress",
    label: "Progress",
    icon: (active) => <ProgressIcon active={active} />,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active) => <ProfileIcon active={active} />,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-separator bottom-nav"
    >
      <div className="flex items-end justify-around px-2 pt-2 pb-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          if (item.center) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 -mt-4"
              >
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 active:scale-95 transition-transform">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <polygon points="10,8 16,12 10,16" fill="white" />
                  </svg>
                </div>
                <span className="text-[10px] text-text-secondary mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 min-w-[52px] active:opacity-60 transition-opacity"
            >
              {item.icon(isActive)}
              <span
                className={`text-[10px] ${
                  isActive ? "text-primary" : "text-text-secondary"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
