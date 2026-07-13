import { formatDate } from '@angular/common';
import { TaskCard } from '../types/all-types';

export function formatTasksForClipboard(
  tasks: TaskCard[],
  weekDays: Date[],
  showDeadline: boolean
): string {

  const week = `${formatDate(weekDays[0], 'MMMM d, yyyy', 'en-US')} ` +
    `to ${formatDate(weekDays[4], 'MMMM d, yyyy', 'en-US')}`

  const weekKeys = weekDays.map(day =>
    formatDate(day, 'yyyy-MM-dd', 'en-US')
  );

  const grouped = tasks
    .filter(task => weekKeys.includes(task.date))
    .reduce((groups, task) => {
      (groups[task.date] ??= []).push(task);
      return groups;
    }, {} as Record<string, TaskCard[]>);


  const hasAnyTasks = Object.values(grouped)
    .some(tasks => tasks.length > 0);

  if (!hasAnyTasks) {
    return `~ No tasks documented for week ${week}.`;
  }

  const header =
    `Tasks for week ${week}:\n\n`;

  const body = weekDays
    .map(day => {
      const key = formatDate(day, 'yyyy-MM-dd', 'en-US');
      const dayTasks = grouped[key] ?? [];

      if (!dayTasks.length) {
        return '';
      }

      const label = formatDate(day, 'EEEE, MMMM d', 'en-US');

      const lines = dayTasks.map(task =>
        `${task.completed ? '[✓]' : '[   ]'} - ` +
        `${task.tag ? `[${task.tag.name}] ` : ''}` +
        `${task.title}` +
        `${task.description ? `: ${task.description}` : ''}` +
        `${task.deadline && showDeadline ? ` (Deadline: ${task.deadline})` : ''}`
      ).join('\n');

      return `${label}\n${lines}\n`;
    })
    .filter(Boolean)
    .join('\n\n');


  return header + body;
}