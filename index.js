const config = { "backend": "http://127.0.0.1:8080", pageSize: 10 }
const data = {
  cache: {},
  async get(arg) {
    const cacheData = this.cache[arg]
    if (cacheData) {
      return cacheData
    } else {
      const newData = await this.getNew(arg)
      this.cache[arg] = newData
      return newData
    }
  },
  async getNew(arg) {
    const argObject = JSON.parse(arg)
    argObject.index = 1
    let url
    switch (argObject.kind) {
      case "postList":
        url = `${config.backend}/post/list?size=${config.pageSize}&index=${argObject.index}`
        break
      case "postDetail":
        url = `${config.backend}/post?uuid=${argObject.uuid}`
        break
      case "tagPostList":
        url = `${config.backend}/tag?size=${config.pageSize}&index=${argObject.index}&uuid=${argObject.uuid}`
        break
      case "categoryPostList":
        url = `${config.backend}/category?size=${config.pageSize}&index=${argObject.index}&uuid=${argObject.uuid}`
        break
      default:
        console.error("url not founded")
        return
    }
    const res = await fetch(url)
    if (res.status != 200) {
      console.error("fetch fail")
      return
    }
    const data = await res.json()
    return data
  }
}
const render = {
  cache: {},
  async update() {
    const path = window.location.pathname
    const content = await this.handler(path)
    const app = document.getElementById("app")
    app.innerHTML = ""
    app.appendChild(content)
  },
  async get(arg) {
    const cacheData = this.cache[arg]
    if (cacheData) {
      return cacheData
    } else {
      const newData = this.getNew(arg)
      this.cache[arg] = newData
      return newData
    }
  },
  async getNew(arg) {
    const argObject = JSON.parse(arg)
    switch (argObject.kind) {
      case "postList":
      case "tagPostList":
      case "categoryPostList":
        return await this.postList(arg)
      case "postDetail":
        return await this.postDetail(argObject.uuid)
    }
  },
  async handler(path) {
    let mainDiv
    if (path == "/") {
      mainDiv = await this.get(JSON.stringify({ kind: "postList", index: 1 }))
    } else if (path.startsWith("/list/")) {
      mainDiv = await this.get(JSON.stringify({ kind: "postList", index: Number(path.slice("/post/".length)) }))
    } else if (path.startsWith("/post/")) {
      mainDiv = await this.get(JSON.stringify({
        kind: "postDetail", uuid: path.slice("/post/".length)
      }))
    } else if (path.startsWith("/tag/")) {
      const prefixLen = "/tag/".length
      mainDiv = await this.get(JSON.stringify({ kind: "tagPostList", uuid: path.slice(prefixLen, prefixLen + 32), index: Number(path.slice(prefixLen + 32)) }))
    } else if (path.startsWith("/category/")) {
      const prefixLen = "/category/".length
      mainDiv = await this.get(JSON.stringify({ kind: "categoryPostList", uuid: path.slice(prefixLen, prefixLen + 32), index: Number(path.slice(prefixLen + 32)) }))
    } else {
      return createDiv(null, "404", null)
    }
    return this.container(mainDiv)
  },
  container(mainDiv) {
    const containerDiv = createDiv("container", "", null)
    containerDiv.innerHTML = ""
    containerDiv.appendChild(mainDiv)
    return containerDiv
  },
  async postList(arg) {
    const dataObject = await data.get(arg)
    const postListDiv = createDiv("list", "", null)
    dataObject.forEach(post => {
      const postListItemDiv = createDiv("item", "", postListDiv)
      isLinkable(createDiv("title", post.title, postListItemDiv), "/post/" + post.uuid)
      postListItemDiv.appendChild(this.subTitle(post.date, post.tags, post.category))
      createDiv("brief", post.brief, postListItemDiv)
      postListDiv.appendChild(postListItemDiv)
    })
    return postListDiv
  },
  subTitle(date, tags, category) {
    const subTitleDiv = createDiv("subTitle", "", null)
    createDiv("date", date, subTitleDiv)
    subTitleDiv.appendChild(this.tags(tags))
    subTitleDiv.appendChild(this.category(category))
    return subTitleDiv
  },
  tags(tagsData) {
    const tagsDiv = createDiv("tags", "", null)
    tagsData.forEach(tagData => {
      const tagDiv = createDiv("tag", tagData.name, tagsDiv)
      isLinkable(tagDiv, "/tag/" + tagData.uuid)
    })
    return tagsDiv
  },
  category(categoryData) {
    const categoryDiv = createDiv("category", categoryData.name, null)
    isLinkable(categoryDiv, "/category/" + categoryData.uuid)
    return categoryDiv
  },
  async postDetail(uuid) {
    const post = await data.get(JSON.stringify({ kind: "postDetail", uuid: uuid }))
    const postDetailDiv = createDiv("detail", "", null)
    createDiv("title", post.title, postDetailDiv)
    postDetailDiv.appendChild(this.subTitle(post.date, post.tags, post.category))
    createDiv("brief", post.brief, postDetailDiv)
    createDiv("content", post.content, postDetailDiv)
    return postDetailDiv
  }
}
function createDiv(className, text, parent) {
  const div = document.createElement("div")
  div.innerText = text
  className && div.classList.add(className)
  parent && parent.appendChild(div)
  return div
}
function isLinkable(div, path) {
  div.addEventListener("click", async (e) => {
    e.preventDefault()
    history.pushState({}, '', path)
    await render.update()
  })
}
render.update()
window.addEventListener('load', async () => { await render.update() })
window.addEventListener('popstate', async () => { await render.update() })
