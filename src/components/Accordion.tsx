import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

export const Accordion = ({
  summary,
  right,
  children,
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (o: boolean) => void;
  summary: React.ReactNode;
  right: React.ReactNode;
  children: React.ReactNode;
}): JSX.Element => {
  return (
    <div>
      <div className="flex flex-col sm:flex-row">
        <div
          className="cursor-pointer inline font-bold"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <ChevronDownIcon className="h-4 w-4 inline mr-2" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 inline mr-2" />
          )}
          {summary}
        </div>
        <div className="grow"/>
        <div className="text-right">{right}</div>
      </div>
      {open ? children : null}
    </div>
  );
};