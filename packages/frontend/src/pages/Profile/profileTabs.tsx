import * as Preact from "preact";

import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { useState } from "preact/hooks";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function ProfileTabs({ children }: { children: React.ReactNode }) {
  const childrenArray = Preact.toChildArray(children);
  const tabNames = childrenArray
    .filter(
      (child): child is Preact.VNode<ProfileTabContentProps> =>
        typeof child !== "string" && typeof child !== "number"
    )
    .map((child) => child.props.tabName);

  const [activeTab, setActiveTab] = useState<(typeof tabNames)[number]>(
    tabNames[0]
  );

  const newChildren = childrenArray.map(
    (child: Preact.VNode<ProfileTabContentProps>) =>
      Preact.cloneElement(child, {
        isActive: activeTab === child.props.tabName,
      })
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 sm:hidden">
        <select
          defaultValue={activeTab}
          aria-label="Select a tab"
          className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pl-3 pr-8 text-base text-gray-900 outline-solid outline-1 -outline-offset-1 outline-gray-300 focus:outline-solid focus:outline-2 focus:-outline-offset-2 focus:outline-primary"
          onChange={(e) => setActiveTab((e.target as HTMLSelectElement).value)}
        >
          {tabNames.map((tabName) => (
            <option key={tabName} value={tabName}>
              {tabName}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          aria-hidden="true"
          className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500"
        />
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav aria-label="Tabs" className="-mb-px grid grid-cols-4">
            {tabNames.map((tabName) => (
              <button
                key={tabName}
                type="button"
                onClick={() => setActiveTab(tabName)}
                aria-current={activeTab === tabName ? "page" : undefined}
                className={classNames(
                  activeTab === tabName
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:border-primary hover:text-primary transition-all duration-200",
                  "col-span-2 border-b-2 px-1 py-4 text-center text-sm font-medium"
                )}
              >
                {tabName}
              </button>
            ))}
          </nav>
        </div>
      </div>
      <div>{newChildren}</div>
    </div>
  );
}

type ProfileTabContentProps = {
  tabName: string;
  isActive?: boolean;
  children: React.ReactNode;
};

export function ProfileTabContent({
  isActive,
  children,
}: ProfileTabContentProps) {
  return <div className={isActive ? "block" : "hidden"}>{children}</div>;
}
