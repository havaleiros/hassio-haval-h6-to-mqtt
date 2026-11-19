# Third-Party Notices

The Brazil (BR) authentication payloads, request-signing protocol (`gwm-auth-*`),
and full-chain mTLS handling adapted in `signing.js` and `carConnector.js` are
based on the reference implementation in
[moryoav/ha-gwm-ev](https://github.com/moryoav/ha-gwm-ev), branch
`test/brazil-region`, commit `f7713729de428ce15f35416222d1824e77033de3`
(modules `signing.py`, `br_auth_client.py`, `br_endpoints.py`, `br_identity.py`,
`br_material.py`, and `br_request.py`).

## MIT License

Copyright (c) 2026 Yoav Mor

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
