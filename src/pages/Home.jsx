import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { Header } from "../components/Header";
import { url } from "../const";
import "./home.scss";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Tokyo");

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState("todo"); // todo->未完了 done->完了
  const [lists, setLists] = useState([]);
  const [selectListId, setSelectListId] = useState();
  const [selectListTitle, setSelectListTitle] = useState();
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [cookies] = useCookies();

  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);
  console.log(url);

  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setLists(res.data);  //lists=リスト一覧
        console.log(res.data);
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`);
      });
  }, []);

  useEffect(() => {
    const listId = lists[0]?.id;
    const listTitle = lists[0]?.title
    if (typeof listId !== "undefined") {
      setSelectListId(listId);
      setSelectListTitle(listTitle);
      axios
        .get(`${url}/lists/${listId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks);  //tasks=タスク一覧
          console.log(res.data.tasks);
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`);
        });
    }
  }, [lists]);

  const handleSelectList = (id, title) => {
    setSelectListId(id);
    setSelectListTitle(title);
    axios
      .get(`${url}/lists/${id}/tasks`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setTasks(res.data.tasks);  //tasks=タスク一覧
        console.log(res.data.tasks);  
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`);
      });
  };
  
  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2>リスト一覧</h2>
            <div className="list-menu">
              <p>
                <Link to="/list/new">リスト新規作成</Link>
              </p>
              <p>
                <Link to={`/lists/${selectListId}/edit`}>
                  選択中のリストを編集
                </Link>
              </p>
            </div>
          </div>
          <ul className="list-tab" role="tablist">
            {lists.map((list, key) => {
              const isActive = list.id === selectListId;
              return (
                <li
                  role="tab"
                  id={list.title}
                  aria-controls={`${list.title}のタスク一覧`}
                  tabIndex="0"
                  key={key}
                  className={`list-tab-item ${isActive ? "active" : ""}`}
                  onClick={() => handleSelectList(list.id, list.title)}
                  onKeyDown={() => handleSelectList(list.id, list.title)}
                >
                  {list.title}
                </li>
              );
            })}
          </ul>
          <div className="tasks">
            <div className="tasks-header">
              <h2>タスク一覧</h2>
              <Link to="/task/new">タスク新規作成</Link>
            </div>
            <div className="display-select-wrapper">
              <select
                onChange={handleIsDoneDisplayChange}
                className="display-select"
              >
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            <Tasks
              tasks={tasks}
              selectListId={selectListId}
              isDoneDisplay={isDoneDisplay}
              selectListTitle={selectListTitle}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

// 表示するタスク
const Tasks = (props) => {
  const { tasks, selectListId, isDoneDisplay, selectListTitle } = props;
  if (tasks === null) return <></>;

  if (isDoneDisplay === "done") {
    const filtertask = tasks.filter((task) => {return task.done === true;})
    const listitems = filtertask.map((task, key) => (
      <li key={key} className="task-item">
          <Link
            to={`/lists/${selectListId}/tasks/${task.id}`}
            className="task-item-link"
          >
            {task.title}
            <br />
            {task.done ? "完了" : "未完了"}
            <br />
            期限：{dayjs(task.limit).tz().format("YYYY/MM/DD HH:mm")}
            <br />
            残り日時：{secToDateTime(dayjs(task.limit).diff(dayjs()))}
          </Link>
      </li>
    ))

    return (
      <ul
        role="tabpanel"
        id={`${selectListTitle}のタスク一覧`}
        aria-labelledby={selectListTitle}
        tabIndex="0"
      >
        {listitems}
      </ul>
    );
  }

  const filtertask = tasks.filter((task) => {return task.done === false;})
  const listitems = filtertask.map((task, key) => (
    <li key={key} className="task-item">
      <Link
        to={`/lists/${selectListId}/tasks/${task.id}`}
        className="task-item-link"
      >
        {task.title}
        <br />
        {task.done ? "完了" : "未完了"}
        <br />
        期限：{dayjs(task.limit).format("YYYY/MM/DD HH:mm")}
        <br />
        残り日時：{secToDateTime(dayjs(task.limit).diff(dayjs()))}
      </Link>
    </li>
  ));      

  return (
    <ul
      role="tabpanel"
      id={`${selectListTitle}のタスク一覧`}
      aria-labelledby={selectListTitle}
      tabIndex="0"
    >
      {listitems}
    </ul>
  );
};

function secToDateTime(miliSeconds) {
  const day = Math.floor(miliSeconds/1000 / 86400);
  const hour = Math.floor((miliSeconds/1000 % 86400) / 3600);
  const min = Math.floor((miliSeconds/1000 % 3600) / 60);
  let time = "";
  // day が 0 の場合は「日」は出力しない（hour や min も同様）
  if (day !== 0) {
    time = `${day}日${hour}時間${min}分`;
  } else if (hour !== 0) {
    time = `${hour}時間${min}分`;
  } else {
    time = `${min}分`;
  }
  return time;
}
 