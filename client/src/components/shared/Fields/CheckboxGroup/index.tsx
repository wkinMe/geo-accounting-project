// components/ui/Checkbox/CheckboxGroup.tsx
import { CheckboxGroup as BaseCheckboxGroup } from '@base-ui/react/checkbox-group';
import type { CheckboxGroupProps as BaseCheckboxGroupProps } from '@base-ui/react/checkbox-group';

interface CheckboxGroupProps extends BaseCheckboxGroupProps {
	label: string;
}

export function CheckboxGroup({ label, children, className = '', ...props }: CheckboxGroupProps) {
	const id = `checkbox-group-${label.replace(/\s+/g, '-').toLowerCase()}`;

	return (
		<BaseCheckboxGroup aria-labelledby={id} className={`space-y-2 ${className}`} {...props}>
			<div id={id} className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
				{label}
			</div>
			<div className="space-y-2">{children}</div>
		</BaseCheckboxGroup>
	);
}
