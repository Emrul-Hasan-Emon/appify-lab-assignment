#!/usr/bin/env bash
# Smoke test for the feed API against seeded data. Requires the server running on :4000
# (npm run start:dev) and the DB seeded (npm run seed).
set -u

BASE="http://localhost:4000"
PASS=0
FAIL=0

check() {
  local desc="$1"
  local expected="$2"
  local actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "PASS - $desc"
    PASS=$((PASS+1))
  else
    echo "FAIL - $desc (expected $expected, got $actual)"
    FAIL=$((FAIL+1))
  fi
}

json() {
  node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d)$1)}catch(e){console.log('PARSE_ERROR')}})"
}

echo "== Login as seeded users =="
ALICE_TOKEN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"seed.alice@example.com","password":"password123"}' | json '.accessToken')
BEN_TOKEN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"seed.ben@example.com","password":"password123"}' | json '.accessToken')

check "Alice login returns a token" "true" "$([ -n "$ALICE_TOKEN" ] && [ "$ALICE_TOKEN" != "PARSE_ERROR" ] && echo true || echo false)"
check "Ben login returns a token" "true" "$([ -n "$BEN_TOKEN" ] && [ "$BEN_TOKEN" != "PARSE_ERROR" ] && echo true || echo false)"

echo "== Feed listing & pagination =="
PAGE1=$(curl -s "$BASE/posts?limit=5" -H "Authorization: Bearer $ALICE_TOKEN")
ITEM_COUNT=$(echo "$PAGE1" | json '.items.length')
NEXT_CURSOR=$(echo "$PAGE1" | json '.nextCursor')
check "First page returns 5 items" "5" "$ITEM_COUNT"
check "First page has a nextCursor" "true" "$([ -n "$NEXT_CURSOR" ] && [ "$NEXT_CURSOR" != "null" ] && echo true || echo false)"

PAGE2=$(curl -s "$BASE/posts?limit=5&cursor=$NEXT_CURSOR" -H "Authorization: Bearer $ALICE_TOKEN")
FIRST_ID_PAGE1=$(echo "$PAGE1" | json '.items[0].id')
FIRST_ID_PAGE2=$(echo "$PAGE2" | json '.items[0].id')
check "Second page starts older than first page's cursor" "true" "$([ "$FIRST_ID_PAGE2" -lt "$NEXT_CURSOR" ] 2>/dev/null && echo true || echo false)"
check "Pages don't repeat the same post" "true" "$([ "$FIRST_ID_PAGE1" != "$FIRST_ID_PAGE2" ] && echo true || echo false)"

echo "== Like / unlike a post =="
TARGET_POST_ID=$(echo "$PAGE1" | json '.items[0].id')
LIKE_RES=$(curl -s -X POST "$BASE/posts/$TARGET_POST_ID/like" -H "Authorization: Bearer $ALICE_TOKEN")
check "Like post succeeds" "true" "$(echo "$LIKE_RES" | json '.liked')"

LIKES_LIST=$(curl -s "$BASE/posts/$TARGET_POST_ID/likes" -H "Authorization: Bearer $ALICE_TOKEN")
CONTAINS_ALICE=$(echo "$LIKES_LIST" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const arr=JSON.parse(d);console.log(arr.some(u=>u.firstName==='Alice'))})")
check "Alice appears in the post's likes list" "true" "$CONTAINS_ALICE"

UNLIKE_RES=$(curl -s -X DELETE "$BASE/posts/$TARGET_POST_ID/like" -H "Authorization: Bearer $ALICE_TOKEN")
check "Unlike post succeeds" "false" "$(echo "$UNLIKE_RES" | json '.liked')"

echo "== Comment & reply =="
COMMENT_RES=$(curl -s -X POST "$BASE/posts/$TARGET_POST_ID/comments" -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" -d '{"content":"Smoke test comment"}')
COMMENT_ID=$(echo "$COMMENT_RES" | json '.id')
check "Comment creation returns an id" "true" "$([ -n "$COMMENT_ID" ] && [ "$COMMENT_ID" != "PARSE_ERROR" ] && echo true || echo false)"

REPLY_RES=$(curl -s -X POST "$BASE/posts/$TARGET_POST_ID/comments" -H "Authorization: Bearer $BEN_TOKEN" \
  -H "Content-Type: application/json" -d "{\"content\":\"Smoke test reply\",\"parentId\":$COMMENT_ID}")
REPLY_PARENT=$(echo "$REPLY_RES" | json '.parentId')
check "Reply is linked to parent comment" "$COMMENT_ID" "$REPLY_PARENT"

COMMENT_LIKE_RES=$(curl -s -X POST "$BASE/comments/$COMMENT_ID/like" -H "Authorization: Bearer $BEN_TOKEN")
check "Like comment succeeds" "true" "$(echo "$COMMENT_LIKE_RES" | json '.liked')"

echo "== Private post visibility =="
PRIVATE_RES=$(curl -s -X POST "$BASE/posts" -H "Authorization: Bearer $ALICE_TOKEN" \
  -F "text=smoke-test-private" -F "visibility=private")
PRIVATE_ID=$(echo "$PRIVATE_RES" | json '.id')

BEN_VIEW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/posts/$PRIVATE_ID" -H "Authorization: Bearer $BEN_TOKEN")
check "Non-owner gets 404 on private post" "404" "$BEN_VIEW_STATUS"

ALICE_VIEW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/posts/$PRIVATE_ID" -H "Authorization: Bearer $ALICE_TOKEN")
check "Owner can view own private post" "200" "$ALICE_VIEW_STATUS"

BEN_FEED=$(curl -s "$BASE/posts?limit=50" -H "Authorization: Bearer $BEN_TOKEN")
PRIVATE_IN_BEN_FEED=$(echo "$BEN_FEED" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const p=JSON.parse(d);console.log(p.items.some(i=>i.id===$PRIVATE_ID))})")
check "Private post absent from non-owner's feed" "false" "$PRIVATE_IN_BEN_FEED"

echo "== Authorization on delete =="
BEN_DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/posts/$TARGET_POST_ID" -H "Authorization: Bearer $BEN_TOKEN")
check "Non-owner cannot delete another user's post" "403" "$BEN_DELETE_STATUS"

echo "== Cleanup smoke-test artifacts =="
curl -s -X DELETE "$BASE/posts/$PRIVATE_ID" -H "Authorization: Bearer $ALICE_TOKEN" > /dev/null
curl -s -X DELETE "$BASE/comments/$COMMENT_ID" -H "Authorization: Bearer $ALICE_TOKEN" > /dev/null

echo ""
echo "===================="
echo "PASS: $PASS  FAIL: $FAIL"
echo "===================="
[ "$FAIL" -eq 0 ]
