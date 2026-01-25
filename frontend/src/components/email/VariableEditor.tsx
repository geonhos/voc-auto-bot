'use client';

import type { TemplateVariable } from '@/types';

interface VariableEditorProps {
  variables: TemplateVariable[];
  onVariableChange: (key: string, value: string) => void;
}

/**
 * @description Template variable input form component
 * Allows users to input values for template variables
 */
export function VariableEditor({ variables, onVariableChange }: VariableEditorProps) {
  if (variables.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        템플릿 변수
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {variables.map((variable) => (
          <div key={variable.key}>
            <label
              htmlFor={`var-${variable.key}`}
              className={`block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300 ${
                variable.required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''
              }`}
            >
              {variable.label}
            </label>
            <input
              id={`var-${variable.key}`}
              type="text"
              value={variable.value}
              onChange={(e) => onVariableChange(variable.key, e.target.value)}
              placeholder={`${variable.label} 입력`}
              required={variable.required}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              aria-required={variable.required}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              변수: {`{{${variable.key}}}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
