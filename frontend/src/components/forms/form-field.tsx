import {Input} from '@/components/ui/input';

interface Props extends React.ComponentProps<'input'> { label: string; error?: string }

export default function FormField({id, label, error, ...props}: Props) {
  return <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
    <Input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props}/>
    {error && <p id={`${id}-error`} className="text-sm text-red-700">{error}</p>}
  </div>;
}
