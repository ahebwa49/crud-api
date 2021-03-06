import React from 'react';
import axios, { CancelTokenSource } from 'axios';
import './App.css';

interface IPost {
  userId: number;
  id?: number;
  title: string;
  body: string;
}

interface IState {
  posts: IPost[];
  error?: string;
  cancelTokenSource?: CancelTokenSource;
  loading: boolean;
  editPost: IPost;
}

class App extends React.Component<{}, IState> {
  public constructor(props: {}) {
    super(props);
    this.state = {
      posts: [],
      error: '',
      loading: true,
      editPost: {
        body: '',
        title: '',
        userId: 1,
      },
    };
  }

  public componentDidMount() {
    const cancelToken = axios.CancelToken;
    const cancelTokenSource = cancelToken.source();
    this.setState({ cancelTokenSource });
    axios
      .get<IPost[]>('https://jsonplaceholder.typicode.com/posts', {
        cancelToken: cancelTokenSource.token,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      })
      .then((response) =>
        this.setState({
          posts: response.data,
          loading: false,
        })
      )
      .catch((ex) => {
        const error = axios.isCancel(ex)
          ? 'Request cancelled'
          : ex.code === 'ECONNABORTED'
          ? 'A timeout has occured'
          : ex.response.status === 404
          ? 'Resource not found'
          : 'An unexpected error has occurred';
        this.setState({ error, loading: false });
      });
    // cancelTokenSource.cancel('User cancelled operation');
  }

  private handleCancelClick = () => {
    if (this.state.cancelTokenSource) {
      this.state.cancelTokenSource.cancel('User cancelled operation');
    }
  };

  private handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      editPost: { ...this.state.editPost, title: e.currentTarget.value },
    });
  };

  private handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({
      editPost: { ...this.state.editPost, body: e.currentTarget.value },
    });
  };

  private handleUpdateClick = (post: IPost) => {
    this.setState({
      editPost: post,
    });
  };

  private handleDeleteClick = (post: IPost) => {
    axios
      .delete(`https://jsonplaceholder.typicode.com/posts/${post.id}`)
      .then(() => {
        this.setState({
          posts: this.state.posts.filter((p) => p.id !== post.id),
        });
      });
  };

  private handleSaveClick = () => {
    if (this.state.editPost.id) {
      // TODO - make a PUT request
      axios
        .put<IPost>(
          `https://jsonplaceholder.typicode.com/posts/${this.state.editPost.id}`,
          this.state.editPost,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        .then(() => {
          this.setState({
            editPost: {
              body: '',
              title: '',
              userId: 1,
            },
            posts: this.state.posts
              .filter((post) => post.id !== this.state.editPost.id)
              .concat(this.state.editPost),
          });
        });
    } else {
      axios
        .post<IPost>(
          'https://jsonplaceholder.typicode.com/posts',
          {
            body: this.state.editPost.body,
            title: this.state.editPost.title,
            userId: this.state.editPost.userId,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        .then((response) => {
          this.setState({
            posts: this.state.posts.concat(response.data),
          });
        });
    }
  };

  render() {
    return (
      <div className="App">
        <div className="post-edit">
          <input
            type="text"
            placeholder="Enter title"
            value={this.state.editPost.title}
            onChange={this.handleTitleChange}
          />
          <textarea
            placeholder="Enter body"
            value={this.state.editPost.body}
            onChange={this.handleBodyChange}
          />
          <button onClick={this.handleSaveClick}>Save</button>
        </div>
        {this.state.loading && (
          <button onClick={this.handleCancelClick}>Cancel</button>
        )}
        <ul className="posts">
          {this.state.posts.map((post) => (
            <li key={post.id}>
              <h3>{post.title}</h3>
              <p>{post.body}</p>
              <button onClick={() => this.handleUpdateClick(post)}>
                Update
              </button>
              <button onClick={() => this.handleDeleteClick(post)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
        {this.state.error && <p className="error">{this.state.error}</p>}
      </div>
    );
  }
}

export default App;
