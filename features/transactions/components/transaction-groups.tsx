import Link from "next/link";
import type { MouseEvent } from "react";

import { CategoryIcon } from "@/components/ui/category-icon";
import { Money } from "@/components/ui/money";
import { dateGroupLabel, shortDate, todayInJakarta } from "@/lib/date";
import type { TransactionDto } from "@/schemas/transaction";

import { groupByDate } from "../group-by-date";
import { transactionTitle } from "./transaction-title";

const ROW = "flex items-center gap-3 py-3";
const LIST = "divide-y divide-border";

/**
 * The list on phones (DESIGN.md, Daftar transaksi (HP) and Baris
 * transaksi). Sorted by date (`grouping="day"`), it has one section per day,
 * headed "Hari ini · Min, 15 Nov". Sorted by amount (`grouping="none"`), one
 * date can come back several times, so it is one list without headings and
 * each row starts with its date ("1 Nov · Tagihan"): on a narrow phone a long
 * category is cut off, never the date. Rendered only in the browser (the data
 * is fetched there), so "today" never differs between server and client.
 */
export function TransactionGroups({
  transactions,
  grouping,
}: {
  transactions: TransactionDto[];
  grouping: "day" | "none";
}) {
  const today = todayInJakarta();

  if (grouping === "none") {
    return (
      <ul aria-label="Daftar transaksi" className={LIST}>
        {transactions.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            detail={`${shortDate(transaction.date, today)} · ${transaction.category.name}`}
          />
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groupByDate(transactions).map((group) => {
        const headingId = `transaksi-${group.date}`;
        return (
          <section key={group.date} aria-labelledby={headingId}>
            <h2 id={headingId} className="mb-1 text-sm text-fg-muted">
              {dateGroupLabel(group.date, today)}
            </h2>
            <ul className={LIST}>
              {group.items.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  detail={transaction.category.name}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/**
 * One transaction in a list (DESIGN.md, Baris transaksi). `onClick` runs
 * before the link is followed; calling `preventDefault` there keeps the page
 * (next/link checks it), e.g. to open the edit dialog on desktop instead.
 */
export function TransactionRow({
  transaction,
  detail,
  onClick,
}: {
  transaction: TransactionDto;
  detail: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const title = transactionTitle(transaction);
  const content = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-fg-muted">
        <CategoryIcon name={transaction.category.icon} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate" title={title}>
          {title}
        </p>
        <p className="truncate text-sm text-fg-muted">{detail}</p>
      </div>
      <Money amount={transaction.amount} type={transaction.type} />
    </>
  );
  // The whole row opens the edit page (DESIGN.md, Baris transaksi), except a
  // row still being saved: it has no id on the server yet.
  return (
    <li>
      {transaction.id.startsWith("optimistic-") ? (
        <div className={ROW}>{content}</div>
      ) : (
        <Link
          href={`/transactions/${transaction.id}/edit`}
          onClick={onClick}
          className={`${ROW} -mx-2 rounded-lg px-2 hover:bg-surface-muted`}
        >
          {content}
        </Link>
      )}
    </li>
  );
}
