import * as Preact from "preact";

import { useState } from "preact/hooks";

import { SegmentedToggle } from "../../components/ui/SegmentedToggle";

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
      <SegmentedToggle
        options={tabNames.map((tabName) => ({
          label: tabName,
          value: tabName,
        }))}
        value={activeTab}
        onChange={setActiveTab}
      />
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
