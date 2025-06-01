export default function PublicListHeader({
  list,
}: {
  list: {
    id: string;
    numItems: number;
  };
}) {
  return (
    <div className="flex w-full justify-between">
      <span />
      <p className="text-xs font-light uppercase text-gray-500">
        {list.numItems} bookmarks
      </p>
    </div>
  );
}
