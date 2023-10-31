import { shuffle } from "lodash";
import moment from "moment";
import { v4 as uuid } from "uuid";

import { getRandomInt } from "./utils";

export const mockData = shuffle([
  {
    id: uuid(),
    name: "Ananya",
    summary:
      "Ananya often finds solace in memories of her garden and family gatherings, while the nursing staff provides support by acknowledging her past and suggesting ways to maintain connections with her loved ones.",
    picturePath: "Ananya",
    ingested: [
      {
        id: uuid(),
        audioPath: "Ananya",
        transcript:
          "Good morning, Ananya. How did you sleep last night? Good morning. Not too well, I'm afraid. I kept thinking about my old home and the garden I used to tend. I'm sorry to hear that. Gardens have a special way of touching our hearts. What did you plant in your garden? Oh, I had roses of all colors, jasmine, and even a small vegetable patch with tomatoes and cucumbers. The scent of jasmine in the evening was heavenly. That sounds beautiful. Jasmine has a soothing scent. And there's something special about eating vegetables you've grown yourself. Yes, indeed. My grandchildren used to help me pick them. They were so proud of our little harvests. Those must be precious memories. Spending time in nature with loved ones is therapeutic in its own way. Very much so. Sometimes, when I close my eyes, I can still feel the warmth of the sun and hear the birds chirping. And whenever you want to relive those memories, just let me know. We can sit by the window, feel the sun, and maybe even listen to some bird sounds. That's very kind of you. I would like that very much.",
        createdAt: moment().subtract(getRandomInt(100, 99999), "seconds")
      },
      {
        id: uuid(),
        audioPath: "Ananya",
        transcript:
          "Ananya, I noticed a beautiful photo frame by your bedside. Is that your family? Yes, that was taken during our last family gathering. Those were simpler times. Everyone was together, laughing and sharing stories. It sounds like a wonderful day. Family gatherings have a unique warmth to them. Do you have a favorite memory from that day? I do. My youngest granddaughter performed a traditional dance for us. She was nervous, but she did it so gracefully. I was so proud. That must have been a heartwarming moment. Traditions are a beautiful way to connect generations. Did you teach her the dance? I didn't teach her directly, but she used to watch me dance when she was a toddler. I guess she picked up a move or two from her old grandma. It's amazing how children absorb things around them. She must admire you a lot to have remembered and learned from watching you. Maybe she does. I just wish I could see her dance again. It brings so much joy to my heart. We could perhaps arrange a video call sometime. Technology has made it easier for us to connect with our loved ones, even from a distance. That would be wonderful. It's been a while since I last spoke to her. Then let's make it happen. I'll help you set it up tomorrow.",
        createdAt: moment().subtract(getRandomInt(100, 99999), "seconds")
      }
    ],
    lastSeen: moment().subtract(getRandomInt(100, 99999), "seconds"),
    dataHash: "-"
  },
  {
    id: uuid(),
    name: "Clara",
    summary:
      "Clara felt generally well but highlighted some joint discomfort, especially during colder weather. The healthcare professional acknowledged her concerns, suggesting potential adjustments to her medication and recommending gentle exercises to alleviate the discomfort. Clara expressed gratitude for the attentive care she receives.",
    picturePath: "Clara",
    ingested: [
      {
        id: uuid(),
        audioPath: "Clara",
        transcript:
          "Good afternoon, Clara. How are you feeling today? Hello, dear. I'm feeling a bit tired, but my spirits are high. The sun always brightens my day. It's good to hear that you're staying positive. The sun does have a way of lifting our mood. Are there any concerns or discomforts you'd like to discuss? I've been experiencing some minor aches in my joints, especially when it's chilly. Is there something I can do about it? It's not uncommon to feel joint discomfort, especially with changes in the weather. I can recommend some gentle exercises and perhaps adjust your medication to help with the pain. We'll make sure you're as comfortable as possible. Thank you. I appreciate all the care you provide. It makes a world of difference.",
        createdAt: moment().subtract(getRandomInt(100, 99999), "seconds")
      }
    ],
    lastSeen: moment().subtract(getRandomInt(100, 99999), "seconds"),
    dataHash: "-"
  },
  {
    id: uuid(),
    name: "Ezekiel",
    summary:
      "Ezekiel was feeling a bit anxious about his upcoming surgery. The healthcare professional acknowledged his concerns, explaining the procedure in detail and reassuring him that he would be in good hands. Ezekiel expressed gratitude for the attentive care he receives.",
    picturePath: "Ezekiel",
    ingested: [
      {
        id: uuid(),
        audioPath: "Ezekiel",
        transcript:
          "Good morning, Ezekiel. How are you feeling today? Good morning. I'm feeling a bit anxious about my upcoming surgery. I understand. It's normal to feel anxious before a procedure. I'll be there to support you every step of the way. Thank you. I appreciate that. I'm sure you're in good hands. I'll make sure of it. I'll be there to support you every step of the way. Thank you. I appreciate that. I'm sure you're in good hands. I'll make sure of it.",
        createdAt: moment().subtract(getRandomInt(100, 99999), "seconds")
      }
    ],
    lastSeen: moment().subtract(getRandomInt(100, 99999), "seconds"),
    dataHash: "-"
  },
  {
    id: uuid(),
    name: "Kai",
    summary:
      "During a check-up with a healthcare professional, Kai expressed some nervousness about doctor's visits and mentioned a cough he developed after playing soccer in the cold. The healthcare professional advised him on the importance of staying warm, especially in colder weather, and reassured him they'd check his lungs to ensure his well-being.",
    picturePath: "Kai",
    ingested: [
      {
        id: uuid(),
        audioPath: "Kai",
        transcript:
          "Hey Kai, how's it going? Ready for your check-up today? I'm good, but a bit nervous. I've never really liked doctor's offices. It's okay to feel that way. We'll make sure you're comfortable. Have you been feeling well lately? Mostly, yeah. Just a bit of a cough after playing soccer outside with my friends. Maybe it's the cold air? Could be. We've been having some chilly days. We'll take a listen to your lungs to make sure everything's okay. And remember, it's important to stay warm after playing, especially as it gets colder. I'll remember that. Thanks!",
        createdAt: moment().subtract(getRandomInt(100, 99999), "seconds")
      }
    ],
    lastSeen: moment().subtract(getRandomInt(100, 99999), "seconds"),
    dataHash: "-"
  },
  {
    id: uuid(),
    name: "Layla",
    summary: "",
    picturePath: "Layla",
    ingested: [],
    lastSeen: moment().subtract(getRandomInt(100, 99999), "seconds"),
    dataHash: "-"
  },
  {
    id: uuid(),
    name: "Lilia",
    summary: "",
    picturePath: "Lilia",
    ingested: [],
    lastSeen: moment().subtract(getRandomInt(100, 99999), "seconds"),
    dataHash: "-"
  },
  {
    id: uuid(),
    name: "Martin",
    summary: "",
    picturePath: "Martin",
    ingested: [],
    lastSeen: moment().subtract(getRandomInt(100, 99999), "seconds"),
    dataHash: "-"
  },
  {
    id: uuid(),
    name: "Nadia",
    summary: "",
    picturePath: "Nadia",
    ingested: [],
    lastSeen: moment().subtract(getRandomInt(100, 99999), "seconds"),
    dataHash: "-"
  },
  {
    id: uuid(),
    name: "Raj",
    summary: "",
    picturePath: "Raj",
    ingested: [],
    lastSeen: moment().subtract(getRandomInt(100, 99999), "seconds"),
    dataHash: "-"
  }
]);
