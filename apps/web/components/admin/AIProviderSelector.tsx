import { FormControl } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AIProviderSelector({
  value,
  options,
  onChange,
}: {
  value?: string;
  options: string[];
  onChange?: (value: string) => void;
}) {
  return (
    <Select onValueChange={onChange} value={value}>
      <FormControl>
        <SelectTrigger className="w-fit">
          <SelectValue placeholder={value} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
