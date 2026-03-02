import React, { useEffect, useState } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "./index.css";

function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [filter, setFilter] = useState("all");
  const [showAlert, setShowAlert] = useState(false);

  const fetchTodos = async () => {
    const res = await axios.get("http://localhost:5000/api/todos");
    setTodos(res.data);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const addTodo = async () => {
    if (!text.trim()) return;
    await axios.post("http://localhost:5000/api/todos", { text });
    setText("");
    fetchTodos();
    setShowAlert(true); 
  };

  const deleteTodo = async (id) => {
    setTodos((prev) => prev.filter((t) => t._id !== id));
    await axios.delete(`http://localhost:5000/api/todos/${id}`);
  };

  const toggleTodo = async (id, completed) => {
    setTodos((prev) =>
      prev.map((t) => (t._id === id ? { ...t, completed: !completed } : t))
    );
    await axios.put(`http://localhost:5000/api/todos/${id}`, {
      completed: !completed,
    });
  };

  const startEdit = (todo) => {
    setEditingId(todo._id);
    setEditText(todo.text);
  };

  const saveEdit = async (id) => {
    await axios.put(`http://localhost:5000/api/todos/${id}`, { text: editText });
    setEditingId(null);
    setEditText("");
    fetchTodos();
  };

  // ✅ DRAG AND DROP
  const handleDragEnd = async (result) => {
    const { draggableId, source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const newCompleted = destination.droppableId === "completed";

    setTodos((prev) =>
      prev.map((t) =>
        t._id === draggableId ? { ...t, completed: newCompleted } : t
      )
    );

    await axios.put(`http://localhost:5000/api/todos/${draggableId}`, {
      completed: newCompleted,
    });
  };

  const allTodos       = todos;
  const pendingTodos   = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) =>  t.completed);

  // What to show in each column based on filter
  const leftList  = filter === "completed" ? [] : pendingTodos;
  const rightList = filter === "pending"   ? [] : completedTodos;

  return (
    <div className="page">
      <h2 className="title">📝 Todo</h2>

      {/* SUCCESS ALERT TOAST */}
      {showAlert && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          backgroundColor: "#22c55e",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "15px",
          fontWeight: "500",
          zIndex: 9999,
          animation: "fadeIn 0.3s ease",
        }}>
          ✅ Task added successfully!
          <button
            onClick={() => setShowAlert(false)}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: "16px",
              marginLeft: "8px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ADD TASK */}
      <div className="add-bar">
        <input
          className="add-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="Enter task"
        />
        <button className="add-btn" onClick={addTodo}>Add</button>
      </div>

      {/* FILTER TABS */}
      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === "all" ? "filter-btn--active-all" : ""}`}
          onClick={() => setFilter("all")}
        >
          All <span className="filter-count">{allTodos.length}</span>
        </button>
        <button
          className={`filter-btn ${filter === "pending" ? "filter-btn--active-pending" : ""}`}
          onClick={() => setFilter("pending")}
        >
          ⏳ Pending <span className="filter-count">{pendingTodos.length}</span>
        </button>
        <button
          className={`filter-btn ${filter === "completed" ? "filter-btn--active-completed" : ""}`}
          onClick={() => setFilter("completed")}
        >
          ✅ Completed <span className="filter-count">{completedTodos.length}</span>
        </button>
      </div>

      {/* DRAG DROP BOARD */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board">

          {/* PENDING COLUMN */}
          {filter !== "completed" && (
            <div className="column-wrap">
              <div className="col-header col-header--pending">
                <span>⏳ Pending</span>
                <span className="badge badge--blue">{pendingTodos.length}</span>
              </div>

              <Droppable droppableId="pending">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`col-list col-list--pending ${snapshot.isDraggingOver ? "col-list--over-blue" : ""}`}
                  >
                    {leftList.length === 0 && (
                      <p className="empty-msg">🎉 No pending tasks!</p>
                    )}

                    {leftList.map((todo, index) => (
                      <Draggable
                        key={todo._id}
                        draggableId={todo._id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`card card--pending ${snapshot.isDragging ? "card--dragging" : ""}`}
                            style={{ ...provided.draggableProps.style }}
                          >
                            <span className="grip">⠿</span>

                            <input
                              type="checkbox"
                              className="cb"
                              checked={todo.completed}
                              onChange={() => toggleTodo(todo._id, todo.completed)}
                            />

                            {editingId === todo._id ? (
                              <>
                                <input
                                  className="edit-input"
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && saveEdit(todo._id)}
                                  autoFocus
                                />
                                <button className="btn btn--save" onClick={() => saveEdit(todo._id)}>Save</button>
                              </>
                            ) : (
                              <>
                                <span className="card-text">{todo.text}</span>
                                <button className="btn btn--edit" onClick={() => startEdit(todo)}>Edit</button>
                              </>
                            )}

                            <button className="btn btn--delete" onClick={() => deleteTodo(todo._id)}>Delete</button>
                          </div>
                        )}
                      </Draggable>
                    ))}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )}

          {filter === "all" && <div className="divider">⇄</div>}

          {/* COMPLETED COLUMN */}
          {filter !== "pending" && (
            <div className="column-wrap">
              <div className="col-header col-header--completed">
                <span>✅ Completed</span>
                <span className="badge badge--green">{completedTodos.length}</span>
              </div>

              <Droppable droppableId="completed">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`col-list col-list--completed ${snapshot.isDraggingOver ? "col-list--over-green" : ""}`}
                  >
                    {rightList.length === 0 && (
                      <p className="empty-msg">← Drag tasks here to complete</p>
                    )}

                    {rightList.map((todo, index) => (
                      <Draggable
                        key={todo._id}
                        draggableId={todo._id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`card card--completed ${snapshot.isDragging ? "card--dragging" : ""}`}
                            style={{ ...provided.draggableProps.style }}
                          >
                            <span className="grip">⠿</span>

                            <input
                              type="checkbox"
                              className="cb"
                              checked={todo.completed}
                              onChange={() => toggleTodo(todo._id, todo.completed)}
                            />

                            {editingId === todo._id ? (
                              <>
                                <input
                                  className="edit-input"
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && saveEdit(todo._id)}
                                  autoFocus
                                />
                                <button className="btn btn--save" onClick={() => saveEdit(todo._id)}>Save</button>
                              </>
                            ) : (
                              <>
                                <span className="card-text">{todo.text}</span>
                                <button className="btn btn--edit" onClick={() => startEdit(todo)}>Edit</button>
                              </>
                            )}

                            <button className="btn btn--delete" onClick={() => deleteTodo(todo._id)}>Delete</button>
                          </div>
                        )}
                      </Draggable>
                    ))}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )}

        </div>
      </DragDropContext>
    </div>
  );
}

export default App;