import {
  ActionForm,
  SubmitButton,
  DeleteButton,
} from "@/components/ui/action-form";
import { saveTodo, deleteTodo } from "@/app/actions/todos";
import type { PersonalTodo, TeamTodo, Profile } from "@/lib/database.types";
const statuses = [
  { value: "todo", label: "To do", color: "#b7c6aa" },
  { value: "in_progress", label: "In progress", color: "#d7ba7f" },
  { value: "done", label: "Done", color: "#7f9d75" },
] as const;
export function TodoForm({ teamSlug }: { teamSlug?: string }) {
  return (
    <ActionForm action={saveTodo} className="quick-add">
      <input name="team_slug" value={teamSlug ?? ""} type="hidden" />
      <label>
        What needs doing?
        <input
          name="title"
          placeholder="Add a little progress to your day…"
          maxLength={240}
          required
        />
      </label>
      <label>
        Due date <span className="sr-only">optional</span>
        <input type="date" name="due_date" aria-label="Optional due date" />
      </label>
      <SubmitButton>Add todo</SubmitButton>
    </ActionForm>
  );
}
export function TodoBoard({
  todos,
  profile,
  teamSlug,
}: {
  todos: (PersonalTodo | TeamTodo)[];
  profile: Profile;
  teamSlug?: string;
}) {
  return (
    <div className="todo-board">
      {statuses.map((status) => {
        const items = todos.filter((todo) => todo.status === status.value);
        return (
          <section className="todo-column" key={status.value}>
            <h2>
              <span>
                <span
                  className="status-dot"
                  style={{ background: status.color }}
                />
                {status.label}
              </span>
              <span className="count">{items.length}</span>
            </h2>
            {items.length ? (
              items.map((todo) => (
                <article className="todo-card" key={todo.id}>
                  <h3>{todo.title}</h3>
                  {todo.due_date && (
                    <span
                      className={`due-date ${todo.due_date < new Date().toISOString().slice(0, 10) && todo.status !== "done" ? "overdue" : ""}`}
                    >
                      Due{" "}
                      {new Date(
                        `${todo.due_date}T12:00:00Z`,
                      ).toLocaleDateString("en-GB", {
                        timeZone: "UTC",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                  <details>
                    <summary>Edit todo</summary>
                    <ActionForm action={saveTodo} className="stack">
                      <input
                        name="team_slug"
                        value={teamSlug ?? ""}
                        type="hidden"
                      />
                      <input name="id" value={todo.id} type="hidden" />
                      <label>
                        Title
                        <input
                          name="title"
                          defaultValue={todo.title}
                          maxLength={240}
                          required
                        />
                      </label>
                      <label>
                        Status
                        <select name="status" defaultValue={todo.status}>
                          {statuses.map((s) => (
                            <option value={s.value} key={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Due date
                        <input
                          type="date"
                          name="due_date"
                          defaultValue={todo.due_date ?? ""}
                        />
                      </label>
                      <SubmitButton className="button small">
                        Save changes
                      </SubmitButton>
                    </ActionForm>
                    {(!teamSlug ||
                      todo.created_by === profile.id ||
                      profile.role !== "member") && (
                      <ActionForm action={deleteTodo}>
                        <input
                          name="team_slug"
                          value={teamSlug ?? ""}
                          type="hidden"
                        />
                        <input name="id" value={todo.id} type="hidden" />
                        <DeleteButton />
                      </ActionForm>
                    )}
                  </details>
                </article>
              ))
            ) : (
              <p className="small muted">Room for what’s next.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
