import React, { createContext, useContext, useEffect, useState } from "react";
import * as SQLite from "expo-sqlite";
import { createDatabase } from "../database/schema";
import { Repository } from "../database/repository";

interface DatabaseContextValue {
  db: SQLite.SQLiteDatabase | null;
  repo: Repository | null;
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  repo: null,
  isReady: false,
});

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [repo, setRepo] = useState<Repository | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const database = await createDatabase();
        setDb(database);
        setRepo(new Repository(database));
      } catch (e) {
        console.error("DB init error:", e);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, repo, isReady }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
