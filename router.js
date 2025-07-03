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
    let url
    switch (argObject.kind) {
      case "postList":
        url = config.backend + "/post/list?size=" + config.pageSize + "&index=" + argObject.index
        break
      case "postDetail":
        url = config.backend + "/post/detail?uuid=" + argObject.uuid
        break
      case "tagPostList":
        url = config.backend + "/tag/list?size=" + config.pageSize + "&index=" + argObject.index
        break
      case "categoryPostList":
        url = config.backend + "/category/list?size=" + config.pageSize + "&index=" + argObject.index
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
    console.log(content)
    document.getElementById("app").appendChild(content)
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
    const argObject = json.parse(arg)
    switch (argObject.kind) {
      case "postList": return await this.postList(argObject.index)
    }
  },
  async handler(path) {
    if (path == "/") {
      return "index"
    } else if (path.startsWith("/list/")) {
      return await this.postList(Number(path.slice("/list/".length)))
    } else {
      return 404
    }
  },
  async postList(index) {
    const arg = JSON.stringify({ kind: "postList", index: index })
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
  }
}
function createDiv(className, text, parent) {
  const div = document.createElement("div")
  div.innerText = text
  div.classList.add(className)
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
