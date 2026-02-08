PS C:\Projetos\APIBR2\backend> .\test-scraping-simple.ps1
APIBR2 - Testes de Scraping Corrigidos
=======================================
1. Scraping Basico
SUCESSO: Scraping basico funcionou!
{
    "success":  true,
    "data":  {
                 "title":  null,
                 "links":  [

                           ],
                 "content":  null
             },
    "metadata":  {
                     "strategy":  "basic",
                     "url":  "https://httpbin.org/json",
                     "timestamp":  "2025-07-05T05:13:20.864Z",
                     "executionTime":  2866
                 }
}

2. Scraping com Screenshot
ERRO no screenshot: O servidor remoto retornou um erro: (500) Erro Interno do Servidor.

3. Scraping JavaScript
ERRO no JavaScript scraping: O servidor remoto retornou um erro: (500) Erro Interno do Servidor.

4. Scraping Assincrono
ERRO no scraping assincrono: O servidor remoto retornou um erro: (400) Solicitação Incorreta.

5. Estatisticas do Browser Pool
SUCESSO: Estatisticas obtidas!
{
    "browserPool":  {
                        "total":  5,
                        "available":  5,
                        "busy":  0,
                        "initialized":  true
                    },
    "timestamp":  "2025-07-05T05:13:26.581Z"
}

Testes de scraping concluidos!

Estrategias disponiveis:
  - basic: Scraping simples com seletores CSS
  - javascript: Execucao de scripts JavaScript
  - form: Interacao com formularios
  - screenshot: Captura de screenshots
PS C:\Projetos\APIBR2\backend>
---
Meu n8n eu tinha um scrape do youtube que lutamos para fazer funcionar no passado que parou de funcionar, vou colar a consulta e resultado de quando funcionava e o erro em seguida.
Consulta:
Method
POST
URL
http://apibr.giesel.com.br:3000/api/youtube/scrape
Authentication
None
Send Query Parameters

Send Headers

Specify Headers
Using Fields Below
Header Parameters
Name
x-api-key
Value
test-api-key-123
Name
Content-Type
Value
application/json
Send Body

Body Content Type
JSON
Specify Body
Using Fields Below
Body Parameters
Name
channelUrl
Value
https://www.youtube.com/@thiagocalimanIA
Name
maxResults
Value
2
---
[
  {
    "success": true,
    "count": 2,
    "channel": "thiagocalimanIA",
    "videos": [
      {
        "videoId": "3awkj2_gSes",
        "title": "AI Sci-Fi Short Film | Made with Google Veo 2 + Flow + MusicFX",
        "url": "https://www.youtube.com/watch?v=3awkj2_gSes&pp=0gcJCcEJAYcqIYzv",
        "views": 0,
        "age": "1 month ago",
        "thumbnail": "https://i.ytimg.com/vi/3awkj2_gSes/hqdefault.jpg?sqp=-oaymwEnCNACELwBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLBAYjkB7XJN1oqhBrsfLa4p91_SNw",
        "channelUrl": "https://www.youtube.com/@thiagocalimanIA",
        "channel": "thiagocalimanIA",
        "publishedAt": "2025-06-03T13:36:48.698Z",
        "ocrText": null
      },
      {
        "videoId": "kRNDjmODeaM",
        "title": "AI Career Prep： Resumes and Interviews",
        "url": "https://www.youtube.com/watch?v=kRNDjmODeaM",
        "views": 0,
        "age": "2 months ago",
        "thumbnail": "https://i.ytimg.com/vi/kRNDjmODeaM/hqdefault.jpg?sqp=-oaymwFBCNACELwBSFryq4qpAzMIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB8AEB-AH-CYAC0AWKAgwIABABGGUgZShlMA8=&rs=AOn4CLBlclRiVPvarwYXzcGtDjMSni4DIQ",
        "channelUrl": "https://www.youtube.com/@thiagocalimanIA",
        "channel": "thiagocalimanIA",
        "publishedAt": "2025-05-03T13:36:48.698Z",
        "ocrText": null
      }
    ]
  }
]
---
Isso foi o historico da semana passada, fui testar agora e  o erro:
 From HTTP Request
Error code

404

Full message

404 - "{\"error\":\"Not Found\",\"message\":\"The requested resource was not found\"}"
Request

{ "body": { "channelUrl": "https://www.youtube.com/@thiagocalimanIA", "maxResults": "2" }, "headers": { "x-api-key": "**hidden**", "content-type": "application/json", "accept": "application/json,text/html,application/xhtml+xml,application/xml,text/*;q=0.9, image/*;q=0.8, */*;q=0.7" }, "method": "POST", "uri": "http://apibr.giesel.com.br:3000/api/youtube/scrape", "gzip": true, "rejectUnauthorized": true, "followRedirect": true, "resolveWithFullResponse": true, "followAllRedirects": true, "timeout": 300000, "encoding": null, "json": false, "useStream": true }
 Other info