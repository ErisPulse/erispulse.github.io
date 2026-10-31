import base64
import json
import os
import subprocess
import urllib.request

REPO = "ErisPulse/erispulse.github.io"
BRANCH = "main"
MSG = "feat(design): 首页特性区改为瀑布式滚动浮现，聊天演示统一玻璃气泡"

token = subprocess.check_output(["gh", "auth", "token"], text=True).strip()


def api(path, method="GET", payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request("https://api.github.com" + path, data=data, method=method)
    req.add_header("Authorization", "Bearer " + token)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "ErisPulse-Publisher")
    if data:
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read().decode())


ref = api("/repos/%s/git/ref/heads/%s" % (REPO, BRANCH))
base_sha = ref["object"]["sha"]
base_commit = api("/repos/%s/git/commits/%s" % (REPO, base_sha))
base_tree = base_commit["tree"]["sha"]
print("base", base_sha[:10])

files = subprocess.check_output(["git", "status", "--porcelain"], text=True)
paths = []
for line in files.splitlines():
    if not line.strip():
        continue
    p = line[3:].strip()
    if p.endswith("/"):
        for root, _, names in os.walk(p):
            for n in names:
                paths.append(os.path.join(root, n).replace("\\", "/"))
    else:
        paths.append(p)

tree = []
for p in paths:
    if not os.path.isfile(p):
        continue
    content = base64.b64encode(open(p, "rb").read()).decode()
    blob = api("/repos/%s/git/blobs" % REPO, "POST", {"content": content, "encoding": "base64"})
    tree.append({"path": p, "mode": "100644", "type": "blob", "sha": blob["sha"]})
    print("blob", p, blob["sha"][:8])

new_tree = api("/repos/%s/git/trees" % REPO, "POST", {"base_tree": base_tree, "tree": tree})
commit = api("/repos/%s/git/commits" % REPO, "POST", {"message": MSG, "tree": new_tree["sha"], "parents": [base_sha]})
api("/repos/%s/git/refs/heads/%s" % (REPO, BRANCH), "PATCH", {"sha": commit["sha"]})
print("pushed", commit["sha"], "files", len(tree))
