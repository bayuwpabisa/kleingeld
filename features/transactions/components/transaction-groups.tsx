import { CategoryIcon } from "@/components/ui/category-icon";
import { Money } from "@/components/ui/money";
import { dateGroupLabel, todayInJakarta } from "@/lib/date";
import type { TransactionDto } from "@/schemas/transaction";

import { groupByDate } from "../group-by-date";
import { transactionTitle } from "./transaction-title";

/**
 * The list on phones (DESIGN.md, Baris transaksi): one section per day,
 * headed "Hari ini · Min, 15 Nov", rows with the category icon, title,
 * category and amount. Rendered only in the browser (the data is fetched
 * there), so "today" never differs between server and client.
 */
export function TransactionGroups({
  transactions,
}: {
  transactions: TransactionDto[];
}) {
  const today = todayInJakarta();

  return (
    <div className="flex flex-col gap-6">
      {groupByDate(transactions).map((group) => {
        const headingId = `transaksi-${group.date}`;
        return (
          <section key={group.date} aria-labelledby={headingId}>
            <h2 id={headingId} className="mb-1 text-sm text-fg-muted">
              {dateGroupLabel(group.date, today)}
            </h2>
            <ul className="divide-y divide-border">
              {group.items.map((transaction) => {
                const title = transactionTitle(transaction);
                return (
                  <li
                    key={transaction.id}
                    className="flex items-center gap-3 py-3"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-fg-muted">
                      <CategoryIcon name={transaction.category.icon} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate" title={title}>
                        {title}
                      </p>
                      <p className="truncate text-sm text-fg-muted">
                        {transaction.category.name}
                      </p>
                    </div>
                    <Money
                      amount={transaction.amount}
                      type={transaction.type}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
