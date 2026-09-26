import React from 'react';
import { ImprovementBadge } from './ImprovementBadge';
import { SwipeableTodoItem } from './SwipeableTodoItem';
import type { Improvement, Habit } from '../types';

export interface Todo {
  id: string;
  emoji: string;
  title: string;
  time: string;
  location: string;
  completed: boolean;
  frozen: boolean;
  streak: number;
  completionRate: number;
  last7Days: { date: string; completed: boolean }[];
  /** Raw habit record — needed by the SetReminderButton. */
  habit: Habit;
}

/** The subset of Todo that user input provides when creating a habit. */
export type NewHabitInput = Pick<
  Todo,
  'emoji' | 'title' | 'time' | 'location'
>;

interface TodayTodosProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onFreeze: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  improvement: Improvement | null;
}

export const TodayTodos: React.FC<TodayTodosProps> = ({
  todos,
  onToggle,
  onFreeze,
  onDelete,
  onEdit,
  improvement,
}) => {
  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-sm font-semibold text-gray-900">Today's Todo</h2>
          {todos.length > 0 && (
            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {completedCount}/{todos.length}
            </span>
          )}
          <ImprovementBadge improvement={improvement} />
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-gray-100">
        {todos.map((todo) => (
          <SwipeableTodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onFreeze={onFreeze}
            onDelete={onDelete}
            onEdit={() => onEdit(todo.id)}
          />
        ))}

        {todos.length === 0 && (
          <li className="py-6 text-center text-sm text-gray-400">
            Nothing on your plate today. Tap <strong>New Habit</strong> above to
            get started.
          </li>
        )}
      </ul>
    </div>
  );
};