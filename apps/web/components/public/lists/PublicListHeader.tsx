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
      <p className="text-sm font-light italic text-gray-500">
        {list.numItems} bookmarks
      </p>
    </div>
  );
}
