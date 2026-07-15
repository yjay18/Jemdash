import { EditableNameField } from '@renderer/lib/ui/editable-name-field';
import { Field, FieldLabel } from '@renderer/lib/ui/field';
import { type TaskNameState } from './use-task-name';

interface TaskNameFieldProps {
  state: TaskNameState;
  autoFocus?: boolean;
}

export function TaskNameField({ state, autoFocus = false }: TaskNameFieldProps) {
  const { taskName, placeholder, handleTaskNameChange, showSlugHint } = state;

  return (
    <Field className="flex flex-col gap-1">
      <FieldLabel>Chat name</FieldLabel>
      <EditableNameField
        autoFocus={autoFocus}
        value={taskName}
        placeholder={placeholder || 'Chat name...'}
        onChange={handleTaskNameChange}
      />
      {showSlugHint && (
        <p className="text-muted-foreground mt-1 text-xs">
          Task names only allow letters, numbers, and hyphens.
        </p>
      )}
    </Field>
  );
}
